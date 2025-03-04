import { DevMode } from './module/classes/DevMode.mjs';
import { DevModeConfig } from './module/classes/DevModeConfig.mjs';
import { DevModeSettings } from './module/classes/DevModeSettings.mjs';
import setupApplicationHeaderPrintButton from './module/hooks/app-header-buttons.mjs';
import setupDevModeAnchor from './module/hooks/dev-mode-anchor.mjs';
// import { inspectSystemTemplate } from './module/hooks/inspect-template.mjs';
// import { setupJSONDiff } from './module/hooks/json-changes.mjs';
import autoOpenDocuments from './module/hooks/auto-open-documents.mjs';
import {
  setupHideNotificationsSettings,
  setupHideNotificationsProxy,
} from './module/hooks/hide-notifications-proxy.mjs';

Handlebars.registerHelper('dev-concat', (...args) => {
  DevMode.log(false, args);
  // Ignore the object appended by handlebars.
  if (typeof args[args.length - 1] === 'object') {
    args.pop();
  }
  return args.join('');
});

/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', function () {
  DevMode.log(true, `Initializing ${DevMode.MODULE_ID}`);

  DevModeSettings.registerSettings();
  setupHideNotificationsSettings();

  DevMode.registerPackageDebugFlag(DevMode.MODULE_ID, 'boolean');

  DevMode.setDebugOverrides();

  DevMode.setCompatibilityWarnings();

  game.modules.get(DevMode.MODULE_ID).api = DevMode.API;

  // register any modules as they init
  Hooks.callAll('devModeReady', DevMode.API);

  // add :mage: button to the foundry logo
  $('#logo').after(`<button type='button' id="dev-mode-button">🧙</button>`);
  $('#dev-mode-button').on('click', () => {
    const devModeConfig = new DevModeConfig();
    devModeConfig.render(true);
  });

  setupDevModeAnchor();
});

Hooks.on('ready', () => {
  setupHideNotificationsProxy();

  if (game.paused && game.settings.get(DevMode.MODULE_ID, DevMode.SETTINGS.alwaysUnpause)) {
    game.togglePause(false);
  }

  // setupJSONDiff(); // TODO: Still needs some work to be updated to v12

  // inspectSystemTemplate(); // TODO: Still needs some work to be updated to v12

  setupApplicationHeaderPrintButton();

  // If Vueport is enabled, it needs a little bit to be ready to render a sheet
  if (game.modules.get('vueport')?.active) setTimeout(autoOpenDocuments, 1000);
  else autoOpenDocuments();
});
