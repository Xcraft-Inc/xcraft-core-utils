const {PassThrough} = require('node:stream');
const JSONStream = require('JSONStream');

class RestPassThrough extends PassThrough {
  #exception;

  set _exception(ex) {
    this.#exception = ex;
  }

  get error() {
    return this.#exception;
  }
}

class RestAPI {
  #timeout = 30000;
  #headers = {'content-type': 'application/json'};

  constructor(timeout, headers = {}) {
    this.#timeout = timeout;
    this.#headers = {...this.#headers, ...headers};
  }

  #buildOptions(options) {
    return {
      hooks: {
        beforeError: [
          (error) => {
            const {response} = error;
            if (response && response.body) {
              const code = `${response.statusCode}`;
              error.name = error.message;
              const body =
                typeof response.body === 'string'
                  ? response.body
                  : JSON.stringify(response.body);
              error.message = code === '404' ? error.message : body;
              error.code = code;
              if (error.stack) {
                const pos = error.stack.indexOf('\n');
                error.stack = `${error.stack.substring(
                  0,
                  pos
                )}\n${body}${error.stack.substring(pos)}`;
              }
            }
            if (error.request?.requestUrl?.href && error.stack) {
              const requestUrl = `${error.request?._request?.method} ${error.request?.requestUrl?.href}`;
              const pos = error.stack.indexOf('\n');
              error.stack = `${error.stack.substring(
                0,
                pos
              )}\n${requestUrl}${error.stack.substring(pos)}`;
            }
            return error;
          },
        ],
      },
      headers: this.#headers,
      timeout: {socket: parseInt(this.#timeout)},
      responseType: 'json',
      throwHttpErrors: true,
      ...options,
    };
  }

  /**
   * Convert Buffer stream to JSON stream.
   *
   * @param {*} stream
   * @returns {*}
   */
  #jsonStream(stream) {
    /* We cannot use pipline here, then it's possible to lose
     * some exceptions. The idea is to keep the errors somewhere
     * else, then the user must test the stream against error
     * like that:
     * if (stream.error) {
     *   throw stream.error;
     * }
     */
    const pt = new RestPassThrough({objectMode: true});
    pt._exception = null;
    return stream
      .on('error', (err) => {
        pt._exception = err;
        pt.end();
      })
      .pipe(JSONStream.parse('*'))
      .pipe(pt);
  }

  /**
   * @param {string} query
   * @returns {object}
   */
  async _get(query) {
    const {got} = await import('got');
    const result = await got.get(query, this.#buildOptions());
    return result.body;
  }

  /**
   * @param {string} query
   * @returns {object}
   */
  async _getWithHeaders(query) {
    const {got} = await import('got');
    const result = await got.get(query, this.#buildOptions());
    return {
      body: result.body,
      headers: result.headers,
    };
  }

  /**
   * @param {string} query
   * @param {object} payload
   * @returns {object}
   */
  async _post(query, payload) {
    const {got} = await import('got');
    const result = await got.post(query, this.#buildOptions({json: payload}));
    return result.body;
  }

  /**
   * @param {string} query
   * @returns {object}
   */
  async _delete(query) {
    const {got} = await import('got');
    const result = await got.delete(query, this.#buildOptions());
    return result.body;
  }

  /**
   * @param {string} query
   * @param {object} payload
   * @returns {object}
   */
  async _patch(query, payload) {
    const {got} = await import('got');
    const result = await got.patch(query, this.#buildOptions({json: payload}));
    return result.body;
  }

  async _putForm(query, formData) {
    const {got} = await import('got');
    const {'content-type': _, ...headers} = this.#headers;
    const result = await got.put(
      query,
      this.#buildOptions({body: formData, headers})
    );
    return result.body;
  }

  /**
   * GET data with a stream
   *
   * @param {*} query http(s) query
   * @param {*} [json] returns a JSONStream
   * @returns {Promise<Stream>} stream
   */
  async _getStream(query, json = true) {
    const {got} = await import('got');
    const _stream = got.stream.get(query, this.#buildOptions());
    return json ? this.#jsonStream(_stream) : _stream;
  }

  /**
   * POST a payload and return a stream
   *
   * @param {*} query http(s) query
   * @param {object} payload JSON
   * @param {*} [json] returns a JSONStream
   * @returns {Promise<Stream>} stream
   */
  async _postStream(query, payload, json = true) {
    const {got} = await import('got');
    const _stream = got.stream.post(query, this.#buildOptions({json: payload}));
    return json ? this.#jsonStream(_stream) : _stream;
  }

  /**
   * POST a stream and return a stream
   *
   * @param {*} query http(s) query
   * @param {*} stream stream
   * @param {*} [json] returns a JSONStream
   * @returns {Promise<Stream>} stream
   */
  async _streamPostStream(query, stream, json = true) {
    const {got} = await import('got');
    const _stream = got.stream.post(query, this.#buildOptions({body: stream}));
    return json ? this.#jsonStream(_stream) : _stream;
  }
}

module.exports = RestAPI;
