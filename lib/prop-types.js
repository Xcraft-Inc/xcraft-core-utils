import PropTypes from 'prop-types';

/******************************************************************************/

function getType(type) {
  switch (type.type) {
    case 'any':
      return PropTypes.any;
    case 'string':
    case 'color':
    case 'size':
    case 'shortcut':
    case 'angle':
    case 'percentage':
    case 'fontWeight':
    case 'shape':
    case 'spacing':
    case 'verticalSpacing':
    case 'grow':
    case 'fontStyle':
    case 'cursor':
    case 'textTransform':
    case 'justify':
    case 'textJustify':
      return PropTypes.string;
    case 'number':
      return PropTypes.number;
    case 'nabu':
      return (props, propName, componentName) => {
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
                  prop +
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
    case 'glyph':
      return PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          glyph: PropTypes.string,
          color: PropTypes.string,
        }),
      ]);
    case 'bool':
      return PropTypes.oneOf([false, true, 'false', 'true']);
    case 'enum':
      return PropTypes.oneOf(type.values);
    case 'component':
      return PropTypes.node;
    case 'function':
      return PropTypes.func;
    case 'oneOfType':
      // eslint-disable-next-line no-case-declarations
      const types = type.types.map(t => getType(t));
      return PropTypes.oneOfType(types);
    default:
      throw new Error(`Unknown prop type: '${type.type}'`);
  }
}

function getPropType(prop) {
  let propType = prop.type.propType || getType(prop.type);
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
