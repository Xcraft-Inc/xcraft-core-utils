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
    return plainDateTimeISO(new Date(dateOrDateTime));
  }
  // date
  return dateOrDateTime;
}

/**
 * @param {string} dateOrDateTime
 * @param {boolean} [isEndDate=false]
 */
function toJsDate(dateOrDateTime, isEndDate = false) {
  if (!dateOrDateTime.includes('T')) {
    if (isEndDate) {
      return new Date(`${dateOrDateTime}T24:00:00`);
    }
    return new Date(`${dateOrDateTime}T00:00:00`);
  }
  return new Date(dateOrDateTime);
}

/**
 * @param {string} dateOrDateTime
 * @param {boolean} [isEndDate=false]
 */
function getTimestamp(dateOrDateTime, isEndDate = false) {
  return toJsDate(dateOrDateTime, isEndDate).getTime();
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

/**
 * @param {Date} date
 */
function zonedDateTimeISO(date = new Date()) {
  const plainDateTime = plainDateTimeISO(date);
  const offset = (() => {
    const timezoneOffset = -date.getTimezoneOffset();
    if (timezoneOffset === 0) {
      return 'Z';
    }
    const offsetAbs = Math.abs(timezoneOffset);
    const offsetHours = Math.floor(offsetAbs / 60)
      .toString()
      .padStart(2, '0');
    const offsetMinutes = (offsetAbs % 60).toString().padStart(2, '0');
    return `${timezoneOffset < 0 ? `-` : '+'}${offsetHours}:${offsetMinutes}`;
  })();
  return `${plainDateTime}${offset}`;
}

module.exports = {
  toPlannerDate,
  toJsDate,
  getTimestamp,
  plainDateISO,
  plainTimeISO,
  plainDateTimeISO,
  zonedDateTimeISO,
};
