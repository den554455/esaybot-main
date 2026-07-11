# security-check.ps1
Write-Host "=== 🔒 SECURITY CHECK ===" -ForegroundColor Green

# Check for .env
if (Test-Path .env) {
    Write-Host "⚠️ .env file exists! DON'T COMMIT!" -ForegroundColor Red
}

# Search for secrets
Write-Host "`nSearching for hardcoded secrets..." -ForegroundColor Yellow
findstr /s /i "API_KEY SECRET Bearer token password auth" src\*

# Check .gitignore
if (Test-Path .gitignore) {
    $envIgnore = Select-String -Path .gitignore -Pattern ".env" -Quiet
    if ($envIgnore) {
        Write-Host "✅ .env in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "❌ .env NOT in .gitignore!" -ForegroundColor Red
    }
}
