param(
    [Parameter(Mandatory=$true)]
    [string]$RootFolder 
)

$ErrorActionPreference = "stop" 
Set-StrictMode -Version 1


Write-Host Will store downloads in $RootFolder
# Load the JSON file
$jsonFolder = "C:\Users\seven\Documents\GitHub\Wacom-Driver-List"
$jsonPath = Join-Path $jsonFolder "wacom-drivers.json"
if (-not (Test-Path $jsonPath)) {
    Write-Error "JSON file not found at $jsonPath"
    exit 1
}

# LOAD JSON

$drivers = Get-Content -Path $jsonPath | ConvertFrom-Json

# Loop through each driver

foreach ($driver in $drivers) {

    $driverUID = $driver.DriverUID
    $folderPath = Join-Path $RootFolder "Downloads"
    $folderPath = Join-Path $folderPath $driverUID  
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
        Write-Host "Created folder: $folderPath"
    }

    $urls = @($driver.DriverURLWacom, $driver.DriverURLArchiveDotOrg, $driver.ReleaseNotesURL)

    foreach ($url in $urls)
    {
        if ([string]::IsNullOrWhiteSpace($url)) 
        {
            continue
        }


        $remote_exists = $false

        # Test if the URL file exists
        Write-Host $driver.DriverName "------------------------"
        $request = [System.Net.WebRequest]::Create($url)
        $request.Method = "HEAD"  # Use HEAD to check existence without downloading
        try {

            $response = $request.GetResponse()
            $response.Close()
            $remote_exists = $true;
        }
        catch {
            Write-host "404 for" $url
            Start-Sleep -Milliseconds 3000

        }

        $fileName = [System.IO.Path]::GetFileName($url)
        $outputPath = Join-Path -Path $folderPath -ChildPath $fileName

        $local_exists = Test-Path $outputPath

        if ($remote_exists -and (-not $local_exists))
        {
            #Download the file
            Invoke-WebRequest -Uri $url -OutFile $outputPath -UseBasicParsing
            Write-Host "Downloaded $fileName to $folderPath"
        
            # Sleep for 300 milliseconds after each download
            Start-Sleep -Milliseconds 3000
        }
        else
        {
            Write-Host "Already exists" $outputPath
        }


    }



}

Write-Host "Script completed."