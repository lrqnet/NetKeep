import LocaleController from './LocaleController';
import RestoreRequestController from './RestoreRequestController';
import TlsActivationController from './TlsActivationController';
import Internal from './Internal';
import SetupController from './SetupController';
import DashboardController from './DashboardController';
import DeviceController from './DeviceController';
import ConfigurationController from './ConfigurationController';
import CredentialProfileController from './CredentialProfileController';
import CatalogController from './CatalogController';
import CustomModelController from './CustomModelController';
import IntegrationController from './IntegrationController';
import NotificationChannelController from './NotificationChannelController';
import DataProtectionController from './DataProtectionController';
import UserController from './UserController';
import AuditController from './AuditController';
import UpdateController from './UpdateController';
import SystemSettingsController from './SystemSettingsController';
import DangerousFeatureController from './DangerousFeatureController';
import Settings from './Settings';

const Controllers = {
    LocaleController: Object.assign(LocaleController, LocaleController),
    RestoreRequestController: Object.assign(
        RestoreRequestController,
        RestoreRequestController,
    ),
    TlsActivationController: Object.assign(
        TlsActivationController,
        TlsActivationController,
    ),
    Internal: Object.assign(Internal, Internal),
    SetupController: Object.assign(SetupController, SetupController),
    DashboardController: Object.assign(
        DashboardController,
        DashboardController,
    ),
    DeviceController: Object.assign(DeviceController, DeviceController),
    ConfigurationController: Object.assign(
        ConfigurationController,
        ConfigurationController,
    ),
    CredentialProfileController: Object.assign(
        CredentialProfileController,
        CredentialProfileController,
    ),
    CatalogController: Object.assign(CatalogController, CatalogController),
    CustomModelController: Object.assign(
        CustomModelController,
        CustomModelController,
    ),
    IntegrationController: Object.assign(
        IntegrationController,
        IntegrationController,
    ),
    NotificationChannelController: Object.assign(
        NotificationChannelController,
        NotificationChannelController,
    ),
    DataProtectionController: Object.assign(
        DataProtectionController,
        DataProtectionController,
    ),
    UserController: Object.assign(UserController, UserController),
    AuditController: Object.assign(AuditController, AuditController),
    UpdateController: Object.assign(UpdateController, UpdateController),
    SystemSettingsController: Object.assign(
        SystemSettingsController,
        SystemSettingsController,
    ),
    DangerousFeatureController: Object.assign(
        DangerousFeatureController,
        DangerousFeatureController,
    ),
    Settings: Object.assign(Settings, Settings),
};

export default Controllers;
