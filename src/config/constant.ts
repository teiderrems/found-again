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
    COMMANDS = '/commands',
    LOGIN = '/login',
    VERIFY_RESEND = '/verifies/resend',
    FORGET_PASSWORD = '/forget_passwords',
    LOGOUT = '/logout',
}

export enum Pages {
    PROFILE = '/profile',
    OBJECTS_FOUND_CREATE = '/déclarer-objet-trouvé',
    OBJECTS_LOST_CREATE = '/déclarer-perte',
    CALENDAR = '/calendar',
    SIGN_IN = '/connexion',
    SIGN_UP = '/inscription',
    VERIFY = '/verify',
    LOCK = '/lock',
    FORGOT_PASSWORD = '/forgot',
    RESET_PASSWORD = '/reset-password',
    CONFIRM_EMAIL = '/confirmer-email',
     ABOUT='/about',
    SETTINGS='/settings',
    HOME='/',
    SERVICES='/services',
    HELP='/aide',
    SEARCH='/rechercher',
    CONTACT='/contact',
    DASHBOARD='/dashboard',
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
