$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CredMan4 {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags; public uint Type; public IntPtr TargetName; public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public IntPtr TargetAlias; public IntPtr UserName;
  }
  [DllImport("advapi32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern bool CredRead(string target, uint type, uint flags, out IntPtr cred);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
}
'@
$ptr = [IntPtr]::Zero
if (-not [CredMan4]::CredRead('git:https://github.com', 1, 0, [ref]$ptr)) { throw 'no credential' }
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan4+CREDENTIAL])
$blob = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $blob, 0, $c.CredentialBlobSize)
$token = [Text.Encoding]::UTF8.GetString($blob)
if ($token -match '[\u0000-\u001F]') { $token = [Text.Encoding]::Unicode.GetString($blob) }
[CredMan4]::CredFree($ptr)
$headers = @{
  Authorization = "Bearer $token"
  Accept = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent' = 'chanban-deploy'
}
$me = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers $headers -TimeoutSec 30
try {
  $p = Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$($me.login)/chanban/pages" -Headers $headers -Body '{"build_type":"workflow"}' -ContentType 'application/json' -TimeoutSec 30
  "status=$($p.status) url=$($p.html_url)"
} catch {
  "uri=https://api.github.com/repos/$($me.login)/chanban/pages"
  "error=$($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)"
}
