import dayjs from "./dayjs";
import { ConfigType } from 'dayjs';
export const defaultLocale = 'fr';

export enum DATE_FORMAT {
    TIME = 'LT',
    LTS = 'LTS',
    DATE = 'LL',
    DATETIME = 'LLLL',
 }

 export const capitalizeFirstLetter = (word?: string) => {
    if (typeof word !== 'string') {
       return '';
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
 };



export const formatDate = (
    date: ConfigType,
    locale= defaultLocale,
    withHour = true,
 ) => {
    // This function should be used for converting ISO formatted dates to
    // the 'DD/MM/YYYY' or 'DD/MM/YYYY hh:mm:ss' format used everywhere on the project.
    if (!date || !dayjs(date).isValid()) {
       return '-';
    }

    const formatedDate = dayjs(date)
       .locale(locale)
       .format(withHour ? DATE_FORMAT.DATETIME : DATE_FORMAT.DATE);
    return locale == defaultLocale ? capitalizeFirstLetter(formatedDate) : formatedDate;
 };

export const formatTime = (
  date: ConfigType,
  locale= defaultLocale,
) => {
  if (!date || !dayjs(date).isValid()) {
    return '-';
  }

  return  dayjs(date)
    .locale(locale)
    .format( DATE_FORMAT.TIME);
};

 export const parseDate = (date: string, locale=defaultLocale) => {
    let parsedDate = dayjs(date);
    parsedDate = parsedDate.locale(locale);

    return parsedDate.isValid() ? parsedDate :dayjs(date);
 };

