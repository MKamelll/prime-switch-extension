/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'my-indicator-extension';

const { GObject, St, Gio } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Util = imports.misc.util;

// config
const iconSize = 26;
const primePath = '/usr/sbin/prime-select';

// Todo: Get it to work with execCommunicate instead of Util.spawn, it ran it twice!

// ##########################################################################
const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        // Reference: https://github.com/eonpatapon/gnome-shell-extension-caffeine/blob/master/caffeine%40patapon.info/extension.js
        super._init(0.0, _('Switch Indicator'));

        this._settings = this.getSettings();

        this._state = this.getStoredStatus();

        if (this._state === true) {
            primeLog('nvidia is On');
        } else {
            primeLog('intel is On');
        }

        let OnIconPath = `${Me.path}/icons/nvidia-on.png`;
        let OffIconPath = `${Me.path}/icons/nvidia-off.png`;
        
        this._nvidiaOnIcon = Gio.icon_new_for_string(OnIconPath);
        this._nvidiaOffIcon = Gio.icon_new_for_string(OffIconPath);
        
        this._icon = new St.Icon({
            style_class: 'nvidia-icon',
            icon_size: iconSize
        });
        
        this._icon.gicon = this._state ? this._nvidiaOnIcon : this._nvidiaOffIcon;
        this.add_actor(this._icon);
        
        this.connect('button-press-event', this.toggleState.bind(this));
        
        this.connect('touch-event', this.toggleState.bind(this));
    }
    
    // Reference: http://justperfection.channel.gitlab.io/how-to-create-a-gnome-extension-documentation/Document.html#schema
    getSettings() {
        let GioSSS = Gio.SettingsSchemaSource;
        let schemaSource = GioSSS.new_from_directory(
            Me.dir.get_child("schemas").get_path(),
            GioSSS.get_default(),
            false
            );
            
            let schemaObj = schemaSource.lookup(
                'org.gnome.shell.extensions.prime', true);
                
                if (!schemaObj) {
                    throw new Error('cannot find schemas');
                }
                
                return new Gio.Settings({ settings_schema : schemaObj });
            }
            
    toggleState() {
        if (this._state === false) {
            this.primeSelect('nvidia');
            this._state = true;
            this._icon.gicon = this._nvidiaOnIcon;
            // ####################################
            primeLog('Switching to nvidia..');
            // ####################################
            this.setCurrentProfile('nvidia');
        } else if (this._state === true) {
            this.primeSelect('intel');
            this._state = false;
            this._icon.gicon = this._nvidiaOffIcon;
            // #####################################
            primeLog('Switching to intel..');
            // #####################################
            this.setCurrentProfile('intel');
        }
        
    }
    
    primeSelect(profile) {
        let args = ['pkexec', primePath, profile];
        Util.spawn(args);
    }

    getStoredStatus() {
        let storedStatus = this._settings.get_string("current-profile");
        if (storedStatus === 'intel') {
            return false;
        } else if (storedStatus === 'nvidia') {
            return true;
        }
    }

    setCurrentProfile(profile) {
        this._settings.set_string("current-profile", profile);
    }

    notify(mesg) {
        Main.notify(_(mesg));

    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}

function primeLog(logMesg) {
    log(`[Prime-Switch-Log]: ${logMesg}`);
}

function primeLogErr(logMesg) {
    throw logError(new Error(`[Prime-Switch-Error]: ${logMesg}`));
}