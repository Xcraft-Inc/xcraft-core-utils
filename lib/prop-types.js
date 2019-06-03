import PropTypes from 'prop-types';

/******************************************************************************/

function getPropType(prop) {
  let propType;
  switch (prop.type.type) {
    case 'string':
    case 'color':
    case 'glyph':
    case 'size':
    case 'shortcut':
    case 'angle':
    case 'percentage':
    case 'fontWeight':
    case 'shape':
    case 'spacing':
    case 'grow':
    case 'fontStyle':
    case 'cursor':
    case 'textTransform':
    case 'justify':
      propType = PropTypes.string;
      break;
    case 'number':
      propType = PropTypes.number;
      break;
    case 'nabu':
      propType = (props, propName, componentName) => {
        const prop = props[propName];
        if (prop !== null && prop !== undefined) {
          if (typeof prop === 'object') {
            let isNabu =
              'nabuId' in prop ||
              ('_type' in prop &&
                (prop['_type'] === 'translatableString' ||
                  prop['_type'] === 'translatableMarkdown'));
            // Handle Map or OrderedMap
            if (prop.get) {
              isNabu = prop.get('nabuId') ? true : false;
              if (!isNabu) {
                isNabu =
                  prop.get('_type') === 'translatableString' ||
                  prop.get('_type') === 'translatableMarkdown';
              }
            }
            if (!isNabu) {
              return new Error(
                'Invalid prop `' +
                  propName +
                  ' of value "' +
                  props[propName] +
                  '" supplied to' +
                  ' `' +
                  componentName +
                  '`. Validation failed. Missing nabuId !'
              );
            }
          } else if (typeof prop !== 'string' && typeof prop !== 'number') {
            return new Error(
              'Invalid prop `' +
                propName +
                ' of value "' +
                prop +
                '" supplied to' +
                ' `' +
                componentName +
                '`. Validation failed.'
            );
          }
        }
      };
      break;
    case 'bool':
      propType = PropTypes.oneOf([false, true, 'false', 'true']);
      break;
    case 'enum':
      propType = PropTypes.oneOf(prop.type.values);
      break;
    case 'component':
      propType = PropTypes.node;
      break;
    case 'function':
      propType = PropTypes.func;
      break;
    default:
      throw new Error(`Unknown prop type: '${prop.type.type}'`);
  }
  if (prop.required && propType !== undefined) {
    propType = propType.isRequired;
  }
  return propType;
}

function getDefaultProp(prop) {
  if (prop.defaultValue !== undefined) {
    return prop.defaultValue;
  } else {
    return null;
  }
}

/******************************************************************************/

function makePropTypes(props) {
  const propTypes = {};
  for (const prop of props) {
    propTypes[prop.name] = getPropType(prop);
  }
  return propTypes;
}

function makeDefaultProps(props) {
  const defaultProps = {};
  for (const prop of props) {
    const d = getDefaultProp(prop);
    if (d !== null) {
      defaultProps[prop.name] = d;
    }
  }
  return defaultProps;
}

module.exports = {
  makePropTypes,
  makeDefaultProps,
};
