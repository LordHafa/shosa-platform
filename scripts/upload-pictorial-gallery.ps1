param(
  [int]$Limit = 5,
  [switch]$All
)

$ApiBase = "http://localhost:5000/api"
$Email = $env:SHOSA_ADMIN_EMAIL
$Password = $env:SHOSA_ADMIN_PASSWORD

if (-not $Email -or -not $Password) {
  throw "Set SHOSA_ADMIN_EMAIL and SHOSA_ADMIN_PASSWORD environment variables before running this script."
}
$ImagesRoot = Join-Path (Get-Location) "frontend\public\assets\gallery-pictorial-journey"

function Get-CategoryFromFolder($folderName) {
  if ($folderName -match "sacco") { return "sacco_activities" }
  if ($folderName -match "dinner|reunion|fest") { return "dinners" }
  if ($folderName -match "medical|outreach") { return "events" }
  if ($folderName -match "orientation") { return "alumni_orientation" }
  if ($folderName -match "prefects|debating|career|mentorship") { return "career_guidance" }
  if ($folderName -match "campus|headteacher|director|founders") { return "campuses" }
  return "events"
}

function Get-TitleFromFolder($folderName) {
  $clean = $folderName -replace "^\d+_", ""
  $clean = $clean -replace "_", " "
  $clean = (Get-Culture).TextInfo.ToTitleCase($clean)
  return $clean
}

Write-Host "Logging in as admin..."

$loginBody = @{
  email = $Email
  password = $Password
} | ConvertTo-Json

try {
  $login = Invoke-RestMethod -Method POST "$ApiBase/auth/login" -ContentType "application/json" -Body $loginBody
} catch {
  Write-Host "Unified login failed. Trying admin login..."
  $login = Invoke-RestMethod -Method POST "$ApiBase/admin/login" -ContentType "application/json" -Body $loginBody
}

$token = $login.token

if (-not $token) {
  throw "Login succeeded but no token was returned."
}

$headers = @{
  Authorization = "Bearer $token"
}

Write-Host "Admin login OK."
Write-Host "Checking existing gallery items..."

$existingTitles = @{}

try {
  $existing = Invoke-RestMethod -Method GET "$ApiBase/admin/gallery" -Headers $headers
  foreach ($item in $existing) {
    if ($item.title) {
      $existingTitles[$item.title] = $true
    }
  }
  Write-Host "Existing gallery items found: $($existingTitles.Count)"
} catch {
  Write-Host "Could not read existing gallery items. Stopping to avoid duplicates."
  throw
}

$files = Get-ChildItem $ImagesRoot -Recurse -File |
  Where-Object { $_.Extension -match "\.jpg|\.jpeg|\.png|\.webp" } |
  Sort-Object FullName

if (-not $All) {
  $files = $files | Select-Object -First $Limit
}

Write-Host "Images selected for upload: $($files.Count)"

$uploaded = 0
$skipped = 0
$failed = 0

foreach ($file in $files) {
  $folderName = Split-Path $file.DirectoryName -Leaf
  $category = Get-CategoryFromFolder $folderName
  $titleBase = Get-TitleFromFolder $folderName
  $title = "$titleBase - $($file.BaseName)"
  $description = "Historic Seeta High Old Students Association pictorial journey image from the $titleBase collection."

  if ($existingTitles.ContainsKey($title)) {
    Write-Host "Skipping existing: $title"
    $skipped++
    continue
  }

  Write-Host "Uploading: $($file.Name) [$category]"

  try {
    curl.exe --fail -sS -X POST "$ApiBase/admin/gallery" `
      -H "Authorization: Bearer $token" `
      -F "title=$title" `
      -F "category=$category" `
      -F "description=$description" `
      -F "image=@$($file.FullName);type=image/jpeg" | Out-Null

    $existingTitles[$title] = $true
    $uploaded++
  } catch {
    Write-Host "FAILED: $($file.FullName)"
    Write-Host $_
    $failed++
  }
}

Write-Host "Upload complete."
Write-Host "Uploaded: $uploaded"
Write-Host "Skipped existing: $skipped"
Write-Host "Failed: $failed"
