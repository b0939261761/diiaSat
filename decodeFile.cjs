/* eslint-disable no-use-before-define */
/* eslint-disable no-eval */

const fs1 = require('fs');

eval(`${fs1.readFileSync('./lib/euscpt.js')}`);
eval(`${fs1.readFileSync('./lib/euscpm.js')}`);
eval(`${fs1.readFileSync('./lib/euscp.js')}`);

//= ============================================================================

const dataCAs = require('./publicData/CAs.json');

const publicCertPath = './publicData/CACertificates.p7b';
const keyFilePath = './privateData/Key-6.dat';
const privateCertPath = `./privateData/${process.env.KEY_CERT_FILE}`;
const issuerCN = '"Дія". Кваліфікований надавач електронних довірчих послуг';

//= ============================================================================

const SetSettings = () => {
  const offline = false;

  const CASettings = dataCAs.find(el => el.issuerCNs.includes(issuerCN));

  euSign.SetJavaStringCompliant(true);

  const fileStoreSettings = euSign.CreateFileStoreSettings();
  fileStoreSettings.SetPath('');
  fileStoreSettings.SetSaveLoadedCerts(false);
  euSign.SetFileStoreSettings(fileStoreSettings);

  const modeSettings = euSign.CreateModeSettings();
  modeSettings.SetOfflineMode(offline);
  euSign.SetModeSettings(modeSettings);

  euSign.SetProxySettings(euSign.CreateProxySettings());

  const TSPSettings = euSign.CreateTSPSettings();
  TSPSettings.SetGetStamps(true);
  TSPSettings.SetAddress(CASettings.tspAddress);
  TSPSettings.SetPort(CASettings.tspAddressPort);
  euSign.SetTSPSettings(TSPSettings);

  const OCSPSettings = euSign.CreateOCSPSettings();
  OCSPSettings.SetUseOCSP(true);
  OCSPSettings.SetBeforeStore(true);
  OCSPSettings.SetAddress(CASettings.ocspAccessPointAddress);
  OCSPSettings.SetPort(CASettings.ocspAccessPointPort);
  euSign.SetOCSPSettings(OCSPSettings);

  const OCSPAccessInfoModeSettings = euSign.CreateOCSPAccessInfoModeSettings();
  OCSPAccessInfoModeSettings.SetEnabled(true);
  euSign.SetOCSPAccessInfoModeSettings(OCSPAccessInfoModeSettings);

  const OCSPAccessInfoSettings = euSign.CreateOCSPAccessInfoSettings();

  dataCAs.forEach(ca => {
    OCSPAccessInfoSettings.SetAddress(ca.ocspAccessPointAddress);
    OCSPAccessInfoSettings.SetPort(ca.ocspAccessPointPort);

    ca.issuerCNs.forEach(issuer => {
      OCSPAccessInfoSettings.SetIssuerCN(issuer);
      euSign.SetOCSPAccessInfoSettings(OCSPAccessInfoSettings);
    });
  });

  const CMPSettings = euSign.CreateCMPSettings();
  CMPSettings.SetUseCMP(true);
  CMPSettings.SetAddress(CASettings.cmpAddress);
  CMPSettings.SetPort(80);
  euSign.SetCMPSettings(CMPSettings);

  euSign.SetLDAPSettings(euSign.CreateLDAPSettings());
};

//= ============================================================================

// eslint-disable-next-line no-unused-vars
const EUSignCPModuleInitialized = () => {
  try {
    SetSettings();
    euSign.SaveCertificates(new Uint8Array(fs1.readFileSync(publicCertPath)));
    euSign.SaveCertificate(new Uint8Array(fs1.readFileSync(privateCertPath)));
    const keyFileData = new Uint8Array(fs1.readFileSync(keyFilePath));
    euSign.ReadPrivateKeyBinary(keyFileData, process.env.KEY_FILE_PASSWORD);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
};

//= ============================================================================

// eslint-disable-next-line no-undef
const euSign = EUSignCP();

module.exports = base64Data => {
  const decodeData = euSign.Base64Decode(base64Data);
  const { data: dataSigned } = euSign.DevelopData(decodeData);
  const data = euSign.GetDataFromSignedData(dataSigned);
  return Buffer.from(data);
};
