/**
 * Custom Expo config plugin to force all CocoaPods targets
 * to use a minimum iOS deployment target.
 *
 * This fixes build errors like:
 *   "The iOS deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0,
 *    but the range of supported deployment target versions is 15.0 to X"
 *
 * Usage in app.json plugins array:
 *   "./plugins/withPodsDeploymentTarget"
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MIN_DEPLOYMENT_TARGET = '15.1';

const POST_INSTALL_HOOK = `
  # Fix: Force all pods to use minimum iOS deployment target
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
      if current && current.to_f < ${MIN_DEPLOYMENT_TARGET}.to_f
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_DEPLOYMENT_TARGET}'
      end
    end
  end
`;

// Interpolate the actual value
const HOOK = POST_INSTALL_HOOK
  .replace(/\${MIN_DEPLOYMENT_TARGET}/g, MIN_DEPLOYMENT_TARGET);

module.exports = function withPodsDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return modConfig;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // Only add if not already patched
      if (podfileContent.includes('Force all pods to use minimum iOS deployment target')) {
        return modConfig;
      }

      // Insert post_install hook if one exists, otherwise add a new one
      if (podfileContent.includes('post_install do |installer|')) {
        podfileContent = podfileContent.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${HOOK}`
        );
      } else {
        podfileContent += `\npost_install do |installer|\n${HOOK}\nend\n`;
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return modConfig;
    },
  ]);
};
