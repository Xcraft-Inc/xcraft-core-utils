// @ts-check

/**
 * @param {string} dateOrDateTime
 */
function toPlannerDate(dateOrDateTime) {
  if (!dateOrDateTime) {
    return dateOrDateTime;
  }
  if (dateOrDateTime.includes('T')) {
    // datetime
    return plainDateTimeISO(toJsDate(dateOrDateTime));
  }
  // date
  return dateOrDateTime;
}

const zonedDateTimeRegex = /^(?<datetime>(?<date>-?([1-9][0-9]{3,}|0[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01]))T(?<time>([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?)))(?<suffix>(?<offset>Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))?(\[(?<timezone>!?[a-zA-Z0-9._+/-]+)\])?(?<tags>(\[(!?[a-z0-9_-]=[a-z0-9_-])\])*))$/;
const numOffsetRegex = /^(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)/;

/**
 * @param {string} dateOrDateTime
 * @returns {{datetime: string, date: string, time?: string, suffix?: string, offset?: string, timezone?: string, tags?: string}}
 */
function parseZonedDateTime(dateOrDateTime) {
  if (!dateOrDateTime.includes('T')) {
    return {datetime: dateOrDateTime, date: dateOrDateTime};
  }
  const match = dateOrDateTime.match(zonedDateTimeRegex);
  if (!match || !match.groups) {
    throw new Error(`Bad date '${dateOrDateTime}'`);
  }
  return /**@type {any} */ (match.groups);
}

/**
 * @param {{date: string, time?: string, offset?: string, timezone?: string, tags?: string}} parts
 * @returns {string}
 */
function zonedDateTimeFromParts(parts) {
  const {date, time, offset = '', timezone = null, tags = ''} = parts;
  if (!time) {
    return date;
  }
  return `${date}T${time}${offset}${timezone ? `[${timezone}]` : ''}${tags}`;
}

/**
 * @param {string} dateOrDateTime
 * @param {boolean} [isEndDate=false]
 */
function toJsDate(dateOrDateTime, isEndDate = false) {
  if (!dateOrDateTime.includes('T')) {
    const plainDate = dateOrDateTime;
    if (isEndDate) {
      return new Date(`${plainDate}T24:00:00`);
    }
    return new Date(`${plainDate}T00:00:00`);
  }
  const {datetime, offset = '', timezone} = parseZonedDateTime(dateOrDateTime);
  if (offset === 'Z') {
    return new Date(`${datetime}${offset}`);
  }
  if (timezone) {
    return localDate(datetime, timezone);
  }
  return new Date(`${datetime}${offset}`);
}

/**
 * @param {string} dateOrDateTime
 * @param {boolean} [isEndDate=false]
 */
function getTimestamp(dateOrDateTime, isEndDate = false) {
  return toJsDate(dateOrDateTime, isEndDate).getTime();
}

/**
 * @param {string} dateOrDateTime
 * @returns {string | null}
 */
function getTimezone(dateOrDateTime) {
  const {offset, timezone} = parseZonedDateTime(dateOrDateTime);
  if (timezone) {
    return timezone;
  }
  if (!offset) {
    return null;
  }
  return offset === 'Z' ? 'UTC' : offset;
}

/**
 * @param {string} plainDateTime
 * @param {string | null} timezone
 * @returns {string}
 */
function addTimezone(plainDateTime, timezone) {
  if (!timezone) {
    return plainDateTime;
  }
  if (timezone === 'UTC') {
    return `${plainDateTime}Z`;
  }
  if (timezone.match(numOffsetRegex)) {
    return `${plainDateTime}${timezone}`;
  }
  return `${plainDateTime}[${timezone}]`;
}

/**
 * @param {string} dateTime
 * @param {string | null} timezone
 * @returns {string}
 */
function setTimezone(dateTime, timezone) {
  const {datetime} = parseZonedDateTime(dateTime);
  return addTimezone(datetime, timezone);
}

/**
 * @param {Date} date
 * @param {string} timezone
 * @returns {string}
 */
function dateToTimezone(date, timezone) {
  return date
    .toLocaleString('sv', timezone ? {timeZone: timezone} : undefined)
    .replace(' ', 'T');

  // // Other version
  // const {year, month, day, hour, minute, second} = Object.fromEntries(
  //   new Intl.DateTimeFormat('latin', {
  //     year: 'numeric',
  //     month: '2-digit',
  //     day: '2-digit',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     second: '2-digit',
  //     timeZone: timezone || undefined,
  //   })
  //     .formatToParts(date)
  //     .map(({type, value}) => [type, value])
  // );
  // return `${year}-${month}-${day}T${hour}${minute}${second}`
}

/**
 * @param {Date} date
 * @param {string | null} [timezone]
 * @returns {string}
 */
function dateToZonedDateTime(date, timezone) {
  if (!timezone) {
    return plainDateTimeISO(date);
  }
  const plainDateTime = dateToTimezone(date, timezone);
  return addTimezone(plainDateTime, timezone);
}

/**
 * @param {string} plainDateTime
 * @param {string} timezone
 * @returns {Date}
 */
function localDate(plainDateTime, timezone) {
  // Note: should be improved when the Temporal api will be available
  const date = new Date(plainDateTime);
  const dateTimestamp = date.getTime();
  const zoneTimestamp = new Date(dateToTimezone(date, timezone)).getTime();
  const timeDiff = dateTimestamp - zoneTimestamp;
  return new Date(dateTimestamp + timeDiff);
}

/**
 * @param {Date} date
 */
function plainDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {Date} date
 */
function plainTimeISO(date = new Date()) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * @param {Date} date
 */
function plainDateTimeISO(date = new Date()) {
  const dateISO = plainDateISO(date);
  const timeISO = plainTimeISO(date);
  return `${dateISO}T${timeISO}`;
}

function nowZonedDateTimeISO() {
  const plainDateTime = plainDateTimeISO();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return addTimezone(plainDateTime, timezone);
}

module.exports = {
  toPlannerDate,
  parseZonedDateTime,
  zonedDateTimeFromParts,
  toJsDate,
  getTimestamp,
  getTimezone,
  addTimezone,
  setTimezone,
  dateToZonedDateTime,
  dateToTimezone,
  localDate,
  plainDateISO,
  plainTimeISO,
  plainDateTimeISO,
  nowZonedDateTimeISO,
};
