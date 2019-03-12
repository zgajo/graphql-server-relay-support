const { nodeDefinitions, fromGlobalId } = require("graphql-relay");

const { getUserById } = require("./schema-helpers");

const getObjectById = (type, id) => {
  const types = {
    user: getUserById
  };

  return types[type](id);
};

const { nodeInterface, nodeField } = nodeDefinitions(
  async globalId => {
    const { type, id } = fromGlobalId(globalId);

    const obj = await getObjectById(type.toLowerCase(), id);

    return {
      ...obj,
      type
    };
  },
  object => {
    const { UserType } = require("./schema");

    if (object.type === "User") {
      return UserType;
    }

    return null;
  }
);

exports.nodeInterface = nodeInterface;
exports.nodeField = nodeField;
