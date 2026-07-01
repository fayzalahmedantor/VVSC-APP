$files = Get-ChildItem -Path d:\fresh\admin\src -Include *.jsx,*.css -Recurse

foreach ($file in $files) {
    if ($file.Name -match "LabelPrint|Invoice|index.css|App.css") { continue }
    
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # CSS Backgrounds
    $content = $content -replace 'background:\s*white;?', 'background: var(--bg-card);'
    $content = $content -replace 'background:\s*#fff;?', 'background: var(--bg-card);'
    $content = $content -replace 'background:\s*#FFFFFF;?', 'background: var(--bg-card);'
    
    # JSX Backgrounds
    $content = $content -replace "background:\s*'#fff'", "background: 'var(--bg-card)'"
    $content = $content -replace 'background:\s*"#fff"', 'background: "var(--bg-card)"'
    $content = $content -replace "background:\s*'white'", "background: 'var(--bg-card)'"
    $content = $content -replace 'background:\s*"white"', 'background: "var(--bg-card)"'
    
    # CSS Borders
    $content = $content -replace 'border:\s*1px solid rgba\(0,0,0,0\.1\)', 'border: 1px solid var(--border-light)'
    $content = $content -replace 'border:\s*1px solid rgba\(0,\s*0,\s*0,\s*0\.1\)', 'border: 1px solid var(--border-light)'
    $content = $content -replace 'border:\s*1px solid rgba\(0,0,0,0\.05\)', 'border: 1px solid var(--border-color)'
    $content = $content -replace 'border-bottom:\s*1px solid rgba\(0,0,0,0\.1\)', 'border-bottom: 1px solid var(--border-light)'
    $content = $content -replace 'border-bottom:\s*1px solid rgba\(0,0,0,0\.05\)', 'border-bottom: 1px solid var(--border-color)'
    $content = $content -replace 'border-top:\s*1px solid rgba\(0,0,0,0\.05\)', 'border-top: 1px solid var(--border-color)'
    
    # JSX Borders
    $content = $content -replace "border:\s*'1px solid rgba\(0,0,0,0\.1\)'", "border: '1px solid var(--border-light)'"
    $content = $content -replace "border:\s*'1px solid rgba\(0,0,0,0\.05\)'", "border: '1px solid var(--border-color)'"
    $content = $content -replace "borderRight:\s*'1px solid rgba\(0,0,0,0\.1\)'", "borderRight: '1px solid var(--border-light)'"

    if ($content -cne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
