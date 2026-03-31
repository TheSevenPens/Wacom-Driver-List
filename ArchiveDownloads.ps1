param (
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateSet("DOWNLOAD", "UPDATEMETADATA")]
    [string]$Mode,

    [Parameter(Position=1)]
    [string]$RootFolder
)

$ErrorActionPreference = "stop"
Set-StrictMode -Version 1

# If RootFolder not provided, read from .env file
if (-not $RootFolder) {
    $envFile = Join-Path $PSScriptRoot ".env"
    if (Test-Path $envFile) {
        foreach ($line in Get-Content $envFile) {
            if ($line.StartsWith("ARCHIVE_ROOT=")) {
                $RootFolder = $line.Substring("ARCHIVE_ROOT=".Length)
                break
            }
        }
    }
    if (-not $RootFolder) {
        Write-Error "RootFolder not provided and ARCHIVE_ROOT not found in .env"
        exit 1
    }
}

if (-not (Test-Path $RootFolder -PathType Container)) {
    Write-Error "Root folder does not exist: $RootFolder"
    exit 1
}

Write-Host Will store downloads in $RootFolder
# Load the JSON file
$jsonFolder = $PSScriptRoot
$jsonPath = Join-Path $jsonFolder "wacom-drivers.json"
if (-not (Test-Path $jsonPath)) {
    Write-Error "JSON file not found at $jsonPath"
    exit 1
}

# LOAD JSON

$drivers = Get-Content -Path $jsonPath | ConvertFrom-Json

# Loop through each driver

$download_metadata_file = Join-Path $RootFolder "downloads.json"
$download_dic = @{}

if (Test-Path $download_metadata_file) {
    try {
        $content = Get-Content $download_metadata_file -Raw
        if (-not [string]::IsNullOrWhiteSpace($content)) {
            $jsonObject = $content | ConvertFrom-Json
            if ($jsonObject) {
                foreach ($prop in $jsonObject.PSObject.Properties) {
                    $download_dic[$prop.Name] = $prop.Value
                }
            }
        }
    }
    catch {
        Write-Warning "Could not load existing downloads.json. Starting with empty cache."
    }
} 

$processed_count = 0
foreach ($driver in $drivers) {

    $driverUID = $driver.DriverUID
    $folderPath = Join-Path $RootFolder $driverUID  
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "Created folder: $folderPath"
    }
    $timeout_head = 10000
    $timeout_download = 3000

    $today_string = Get-Date -Format "yyyy-MM-dd";

    $urls = @($driver.DriverURLWacom, $driver.DriverURLArchiveDotOrg, $driver.ReleaseNotesURL)
    foreach ($url in $urls)
    {
        Write-Host $driver.DriverName $url "------------------------"
        if ([string]::IsNullOrWhiteSpace($url)) 
        {
            continue
        }

        $fileName = [System.IO.Path]::GetFileName($url)
        $outputPath = Join-Path -Path $folderPath -ChildPath $fileName
        $local_exists = Test-Path $outputPath
        $remote_exists = $false

        $url_in_cache = $download_dic.ContainsKey($url)
        $url_entry = $null  
        if ($url_in_cache -eq $true)
        {
            $url_entry = $download_dic[ $url ]
        }
        else 
        {
            $url_entry = [PSCustomObject]@{
                Result = "UNKNOWN"
                DateTested = "" }
            $download_dic[ $url ] = $url_entry
        }

        if ($url_entry.Result -eq "UNKNOWN")
        {

            if ($mode -eq "UPDATEMETADATA")
            {
                $request = [System.Net.WebRequest]::Create($url)
                $request.Method = "HEAD"  # Use HEAD to check existence without downloading
                $request.Timeout = $timeout_head
                try {
                    $response = $request.GetResponse()
                    $response.Close()
                    $remote_exists = $true;
                    $url_entry.Result = "EXISTS"
                }
                catch {
                    $statusCode = $null
                    if ($_.Exception.InnerException -is [System.Net.WebException]) {
                        $webResponse = $_.Exception.InnerException.Response
                        if ($webResponse) { $statusCode = [int]$webResponse.StatusCode }
                    }
                    if ($statusCode -eq 404 -or $statusCode -eq 410) {
                        Write-Host "Not found ($statusCode) for" $url
                        $url_entry.Result = "DOESNOTEXIST"
                    } else {
                        Write-Warning "Request failed for $url : $_"
                        $url_entry.Result = "UNKNOWN"
                    }

                }
                $url_entry.DateTested = $today_string

                [PSCustomObject]$download_dic | ConvertTo-Json -Depth 3 | Out-File -FilePath $download_metadata_file -Encoding UTF8

            }
        }


        if ($mode -eq "DOWNLOAD")
        {
            if ($local_exists)
            {
                Write-Host "Already exists" $outputPath
                continue
            }
            if ($url_entry.Result -eq "EXISTS")
            {
                #Download the file
                Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
                Write-Host "Downloaded $fileName to $folderPath"
            
                # Sleep for 300 milliseconds after each download
                Start-Sleep -Milliseconds $timeout_download
            }
        }



    } # end url loop

    $processed_count = $processed_count + 1

  


} # end driver loop
Write-Host "Driver Entries" $drivers.Count
Write-Host "Drivers Processed" $processed_count
Write-Host "Script completed."