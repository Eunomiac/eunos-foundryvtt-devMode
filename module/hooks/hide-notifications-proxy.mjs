import {DevMode} from "../classes/DevMode.mjs";

/**
 * Registers settings for hiding notifications
 * @returns {void}
 */
export function setupHideNotificationsSettings() {
  game.settings.register(DevMode.MODULE_ID, "hideNotificationPatterns", {
    name: "Hide Notification Patterns",
    hint: "Enter each notification pattern on a new line. Any notification containing these patterns will be hidden. Regex patterns are supported.",
    scope: "world",
    config: true,
    type: String,
    default: [
      "Foundry Virtual Tabletop requires a minimum screen resolution",
      "not displayed because the game Canvas is disabled"
    ].join("\n"),
    onChange: () => {
      // Notify users that patterns have been updated
      ui.notifications.info("Notification hiding patterns updated");
      foundry.utils.debounce(() => {
        window.location.reload();
      }, 100);
    }
  });
}

/**
 * Gets the current notification patterns as an array
 * @returns {string[]} Array of notification patterns to hide
 */
function getHideNotificationPatterns() {
  const rawPatterns = game.settings.get(DevMode.MODULE_ID, "hideNotificationPatterns");
  return rawPatterns
    .split("\n")
    .map(pattern => pattern.trim())
    .filter(pattern => pattern.length > 0)
    .map(pattern => {
      try {
        return new RegExp(pattern);
      } catch (error) {
        console.warn(`Invalid regex pattern "${pattern}": ${error.message}`);
        // Return a RegExp that won't match anything
        return new RegExp("(?!)");
      }
    });
}

/**
 * This function initializes a Proxy to intercept changes to the `ui.notifications.queue` array.
 * It accepts an array of strings to match against any notification that would be added to the queue.
 * If a notification matches, the Proxy will modify it to prevent it from logging anything to the
 *  console, and to hide it in the UI.
 *
 * This function should be run during the "ready" Hook call.
 */
export function setupHideNotificationsProxy() {
  const patternsToHide = getHideNotificationPatterns();

  // Do nothing if no patterns are provided.
  if (!patternsToHide.length) {return;}

  // Get the original array of queued notifications, and store a constant reference to it
  const notificationQueue = ui.notifications.queue;

  // Define a handler for the proxy that will be used to intercept notifications
  const handler = {
    set: function (target, property, value) {
      // Handle changes to the array length property
      if (property === "length") {
        // Perform the default behavior for length changes
        target.length = value;
        return true; // Indicate success
      }
      // Handle directly setting the value for non-index properties (necessary for array methods like 'next')
      else if (typeof property === "string" && isNaN(Number(property))) {
        // Perform the default behavior for non-index properties.
        target[property] = value;
        return true; // Indicate success
      }
      // Handle setting array indices
      else if (!isNaN(Number(property))) {
        // If the value is a notification and its content matches one of the provided patterns ...
        if (value
          && typeof value === "object"
          && "message" in value
          && typeof value.message === "string"
          && patternsToHide.some((pattern) => pattern.exec(value.message))) {
          // ... edit the notification to:
          Object.assign(value, {
            console: false, // ... prevent logging it to the console
            permanent: false, // ... ensure the notification element is removed automatically
            type: "do-not-display" // ... 'hack' the type to add the 'do-not-display' class
          });
        }
        // Otherwise, perform the default behavior for setting index properties.
        target[Number(property)] = value;
        return true; // Indicate success
      }
      return false; // Indicate failure for all other cases
    }
  };

  // Replace the notifications queue array with a Proxy defined by the above handler.
  ui.notifications.queue = new Proxy(notificationQueue, handler);
}
