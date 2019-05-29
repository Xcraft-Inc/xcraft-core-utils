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
    case 'nabu':
      propType = PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        //- PropTypes.shape({
        //-   nabuId: PropTypes.string.isRequired,
        //- }),
        //- PropTypes.shape({
        //-   _type: PropTypes.string.isRequired,
        //- }),
      ]);
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
  if (prop.required) {
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
