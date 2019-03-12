const axios = require("axios");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLList
} = require("graphql");
const {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  connectionDefinitions,
  connectionFromPromisedArray,
  connectionArgs
} = require("graphql-relay");

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
    if (object.type === "User") {
      return UserType;
    }

    return null;
  }
);

const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    desc: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then(res => res.data);
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: {
    id: globalIdField(),
    // id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  },
  interfaces: [nodeInterface]
});

const { connectionType: UserConnection } = connectionDefinitions({
  nodeType: UserType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: "Total num of objects in this connection",
      resolve: conn => {
        return conn.edges.length;
      }
    }
  })
});

const getUserById = id =>
  axios.get(`http://localhost:3000/users/${id}`).then(res => res.data);

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    node: nodeField,
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return getUserById(args.id);
      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${args.id}`)
          .then(res => res.data);
      }
    },
    users: {
      type: UserConnection,
      args: connectionArgs,
      resolve(_, args) {
        return connectionFromPromisedArray(
          axios.get(`http://localhost:3000/users`).then(res => res.data),
          args
        );
      }
    },
    companies: {
      type: new GraphQLList(CompanyType),
      resolve() {
        return axios
          .get(`http://localhost:3000/companies`)
          .then(res => res.data);
      }
    }
  }
});

const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
        return axios
          .post(`http://localhost:3000/users`, {
            firstName,
            age
          })
          .then(res => res.data);
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, { id }) {
        return axios
          .delete(`http://localhost:3000/users/${id}`)
          .then(res => res.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios
          .patch(`http://localhost:3000/users/${args.id}`, args)
          .then(res => res.data);
      }
    }
  }
});

exports.schema = new GraphQLSchema({
  query: RootQuery,
  mutation
});
