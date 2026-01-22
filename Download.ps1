param (
    [Parameter(Mandatory=$true)]
    [string]$RootFolder
)

$ErrorActionPreference = "stop" 
Set-StrictMode -Version 1

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



$mode = "DOWNLOAD"
#$mode = "UPDATEMETADATA"

$processed_count = 0
foreach ($driver in $drivers) {

    $driverUID = $driver.DriverUID
    $folderPath = Join-Path $RootFolder $driverUID  
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "Created folder: $folderPath"
    }
    $timeout_head = 500
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
            $url_entry = $download_dic[$url] = [PSCustomObject]@{
                Result = "UNKNOWN"
                DateTested = "" }
                $download_dic[ $url ] = $url_entry
        }

        if ($url_entry.Result -eq "UNKNOWN")
        {

            if ($mode -eq "UPDATEMETADATA")
            {
                Write-Host "XXX"
                $request = [System.Net.WebRequest]::Create($url)
            
                $request.Method = "HEAD"  # Use HEAD to check existence without downloading
                try {
                    $response = $request.GetResponse()
                    $response.Close()
                    $remote_exists = $true;
                    $url_entry.Result = "EXISTS"
                }
                catch {
                    Write-host "404 for" $url
                    Start-Sleep -Milliseconds $timeout_head
                    $url_entry.Result = "DOESNOTEXIST"

                }
                $url_entry.DateTested = $today_string

                $download_dic | ConvertTo-Json -Depth 3 | Out-File -FilePath $download_metadata_file -Encoding UTF8

            }
        }


        if ($local_exists)
        { 
            continue
        }

        if ($mode -eq "DOWNLOAD")
        {
            if (($url_entry.Result -eq "EXISTS") -and (-not $local_exists))
            {
                #Download the file
                Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
                Write-Host "Downloaded $fileName to $folderPath"
            
                # Sleep for 300 milliseconds after each download
                Start-Sleep -Milliseconds $timeout_download
            }
            else
            {
                Write-Host "Already exists" $outputPath
            }
        }



    } # end url loop

    $processed_count = $processed_count + 1

  


} # end driver loop
Write-Host "Driver Entries" $drivers.Count
Write-Host "Drivers Processed" $processed_count
Write-Host "Script completed."