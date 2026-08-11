unit Akshar.SyncManager;

interface

uses
  System.Classes, System.SysUtils, System.Net.HttpClient, System.Net.HttpClientComponent,
  System.JSON, System.IOUtils, IniFiles;

type
  TSyncManager = class
  private
    const RegistryURL = 'https://your-domain.com/api/registry.json';
    class function CompareVersions(const V1, V2: string): Integer;
  public
    class procedure SyncProfiles;
  end;

implementation

{
  █████████████████████████████████████████████████████████████████
  █ AKSHARENGINE OTA SYNC MANAGER                                 █
  █ Retrieves profile registry, checks versions, downloads JSONs. █
  █████████████████████████████████████████████████████████████████
}

class function TSyncManager.CompareVersions(const V1, V2: string): Integer;
var
  Parts1, Parts2: TArray<string>;
  I, Num1, Num2: Integer;
begin
  // Simple semantic version comparator (e.g., '1.0.1' vs '1.0.0')
  Parts1 := V1.Split(['.']);
  Parts2 := V2.Split(['.']);
  
  Result := 0;
  for I := 0 to (Length(Parts1) - 1) do
  begin
    if I >= Length(Parts2) then Exit(1); // V1 has more components and is greater
    
    Num1 := StrToIntDef(Parts1[I], 0);
    Num2 := StrToIntDef(Parts2[I], 0);
    
    if Num1 > Num2 then Exit(1);
    if Num1 < Num2 then Exit(-1);
  end;
  
  if Length(Parts2) > Length(Parts1) then
    Result := -1;
end;

class procedure TSyncManager.SyncProfiles;
var
  Client: TNetHTTPClient;
  RegistryContent: string;
  JSONReg, JSONProfile: TJSONValue;
  ProfilesArr: TJSONArray;
  I: Integer;
  ProfileID, RemoteVersion, DownloadURL, LocalVersion: string;
  ProfilesPath, IniFilePath, TargetJSONFile: string;
  Ini: TIniFile;
  FileStream: TFileStream;
begin
  // Define local storage paths (e.g., C:\Users\User\AppData\Roaming\AksharEngine\)
  ProfilesPath := TPath.Combine(TPath.GetHomePath, 'AksharEngine\Profiles');
  if not TDirectory.Exists(ProfilesPath) then
    TDirectory.CreateDirectory(ProfilesPath);

  IniFilePath := TPath.Combine(ProfilesPath, 'LocalProfiles.ini');
  
  Client := TNetHTTPClient.Create(nil);
  Ini := TIniFile.Create(IniFilePath);
  try
    try
      // 1. Fetch the remote registry
      RegistryContent := Client.Get(RegistryURL).ContentAsString;
      JSONReg := TJSONObject.ParseJSONValue(RegistryContent);
      
      if Assigned(JSONReg) then
      begin
        try
          if JSONReg.TryGetValue<TJSONArray>('profiles', ProfilesArr) then
          begin
            // 2. Iterate through available profiles
            for I := 0 to ProfilesArr.Count - 1 do
            begin
              JSONProfile := ProfilesArr.Items[I];
              
              ProfileID := JSONProfile.GetValue<string>('id');
              RemoteVersion := JSONProfile.GetValue<string>('version');
              DownloadURL := JSONProfile.GetValue<string>('downloadUrl');
              
              // Read local version from the INI file
              LocalVersion := Ini.ReadString('Versions', ProfileID, '0.0.0');
              
              // 3. Compare and Download if newer
              if CompareVersions(RemoteVersion, LocalVersion) > 0 then
              begin
                TargetJSONFile := TPath.Combine(ProfilesPath, ProfileID + '.json');
                
                FileStream := TFileStream.Create(TargetJSONFile, fmCreate);
                try
                  Client.Get(DownloadURL, FileStream);
                finally
                  FileStream.Free;
                end;
                
                // Update INI file with new version
                Ini.WriteString('Versions', ProfileID, RemoteVersion);
              end;
            end;
          end;
        finally
          JSONReg.Free;
        end;
      end;
    except
      on E: Exception do
      begin
        // Handle network or parsing errors safely (e.g., log them)
        // Log.Error('Sync failed: ' + E.Message);
      end;
    end;
  finally
    Ini.Free;
    Client.Free;
  end;
end;

end.
