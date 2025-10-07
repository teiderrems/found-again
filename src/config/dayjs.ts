import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime'; // Import the locale you want to use
import utc from 'dayjs/plugin/utc';
// Extend dayjs with the localizedFormat plugin
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);

export default dayjs;