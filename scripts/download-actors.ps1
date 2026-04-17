$outDir = "\\wsl$\Ubuntu\home\hugoidle\Projects\slubstack\public\actors"

$actors = @(
  "Tom_Hanks", "Morgan_Freeman", "Denzel_Washington", "Samuel_L._Jackson",
  "Brad_Pitt", "Leonardo_DiCaprio", "Matt_Damon", "Johnny_Depp",
  "Keanu_Reeves", "Will_Smith", "Tom_Cruise", "Harrison_Ford",
  "Robert_De_Niro", "Al_Pacino", "Jack_Nicholson", "Jim_Carrey",
  "Robin_Williams", "Eddie_Murphy", "Meryl_Streep", "Julia_Roberts",
  "Sandra_Bullock", "Cate_Blanchett", "Nicole_Kidman", "Charlize_Theron",
  "Halle_Berry", "Angelina_Jolie", "Natalie_Portman", "Scarlett_Johansson",
  "Jennifer_Lawrence", "Emma_Stone", "Reese_Witherspoon", "Viola_Davis"
)

foreach ($actor in $actors) {
  $slug = $actor.ToLower() -replace '[_.]', '-' -replace '[^a-z0-9-]', ''
  $outFile = "$outDir\$slug.jpg"

  if (Test-Path $outFile) { Write-Host "skip $slug (exists)"; continue }

  try {
    $apiUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/$actor"
    $summary = Invoke-RestMethod -Uri $apiUrl -Headers @{ "User-Agent" = "SlubstackApp/1.0" }
    $imgUrl = $summary.thumbnail.source -replace '/\d+px-', '/400px-'
    if (-not $imgUrl) { Write-Host "no image: $actor"; continue }

    Invoke-WebRequest -Uri $imgUrl -OutFile $outFile -Headers @{
      "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      "Referer"    = "https://en.wikipedia.org/"
    }
    Write-Host "OK  $slug"
  } catch {
    Write-Host "ERR $actor : $_"
  }

  Start-Sleep -Milliseconds 600
}

Write-Host "`nDone!"
