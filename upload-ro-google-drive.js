function uploadToGoogleDrive(fileName) {
  const fs = require('fs');
  const fsPromises = require('fs').promises;
  const path = require('path');
  const process = require('process');
  const { authenticate } = require('@google-cloud/local-auth');
  const { google } = require('googleapis');

  // If modifying these scopes, delete token.json.
  // 以下のスコープはアップロード用
  const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appdata',
  ];
  // The file token.json stores the user's access and refresh tokens, and is
  // created automatically when the authorization flow completes for the first
  // time.
  const TOKEN_PATH = path.join(process.cwd(), 'token.json');
  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

  /**
   * Reads previously authorized credentials from the save file.
   *
   * @return {Promise<OAuth2Client | null>}
   */
  async function loadSavedCredentialsIfExist() {
    try {
      const content = await fsPromises.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials);
    } catch (err) {
      return null;
    }
  }

  /**
   * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
   *
   * @param {OAuth2Client} client
   * @return {Promise<void>}
   */
  async function saveCredentials(client) {
    const content = await fsPromises.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fsPromises.writeFile(TOKEN_PATH, payload);
  }

  /**
   * Load or request or authorization to call APIs.
   *
   */
  async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
    return client;
  }

  /**
   * Lists the names and IDs of up to 10 files.
   * @param {OAuth2Client} authClient An authorized OAuth2 client.
   */
  async function createFile(authClient) {
    const drive = google.drive({version: 'v3', auth: authClient});
    // 各年のスケールファイルを格納しているフォルダのID
    const folerId = '13VtSXSl0SEAYCWjk18zTCZGdnGKtmV_v';
    const params = {
      resource: {
        name: fileName,
        parents: [folerId]
      },
      media: {
        mimeType: 'text/csv',
        body: fs.createReadStream(fileName)
      },
      field: 'id',
    };
    const res = await drive.files.create(params);
    console.log('---result', res.data)
  }

  authorize().then(createFile).catch(console.error);
}

module.exports = uploadToGoogleDrive;