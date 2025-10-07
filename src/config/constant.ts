export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
}

export enum ApiFormat {
    JSON = 'application/json',
    JSON_MERGE_PATCH = 'application/merge-patch+json',
    JSONLD = 'application/ld+json',
    GRAPHQL = 'application/graphql',
    JSONAPI = 'application/vnd.api+json',
    HAL = 'application/hal+json',
    YAML = 'application/x-yaml',
    CSV = 'text/csv',
    HTML = 'text/html',
    RAW_JSON = 'raw/json',
    RAW_XML = 'raw/xml',
}

export enum ApiRoutesWithoutPrefix {
    LOGS = '/logs',
    COVERAGE_SANDBOX_LINES = '/coverage/sandbox/lines',
    COMMERCIAL_MODES = 'commercial_modes',
    JOURNEYS = 'journeys',
     USERS = '/users',
    MODULE_TYPES = '/module_types',
    MODULE_HISTORIES = '/module_histories',
    MODULE_STATUSES = '/module_statuses',
    STATISTICS = '/statistics',
    COMMANDS = '/commands',
    LOGIN = '/login',
    VERIFY_RESEND = '/verifies/resend',
    FORGET_PASSWORD = '/forget_passwords',
    LOGOUT = '/logout',
}

export enum AdminPages {
    PROFILES = '/profiles',
    CALENDAR = '/calendar',
    SIGN_IN = '/signin',
    SIGN_UP = '/signup',
    VERIFY = '/verify',
    LOCK = '/lock',
    FORGOT_PASSWORD = '/forgot',
    RESET_PASSWORD = '/reset-password',
}

type BaseApiFilters = 'search' | 'page';

export enum DATE_FORMAT {
    TIME = 'LT',
    LTS = 'LTS',
    DATE = 'LL',
    DATETIME = 'LLLL',
}
export enum LoginAccess {
    EMAIL = 'test@test.com',
    PASSWORD = 'admin',
}
