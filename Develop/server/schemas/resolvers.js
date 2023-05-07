const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User
                    .findOne({ _id: context.user._id })
                    .select('__v -password')
                    .populate('books');

                return userData;
            };

            throw new AuthenticationError('You must be logged in!');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('No user found with this email.');
            };

            const correctPW = await user.isCorrectPassword(password);

            if (!correctPW) {
                throw new AuthenticationError('Incorrect password.');
            };

            const token = signToken(user);
            return { token, user };
        },

        addUser: async (parent, args,) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updateUser = await User
                    .findOneAndUpdate(
                        { _id: context.user._id },
                        { $addToSet: { savedBooks: bookData } },
                        { new: true },
                    )
                    .populate('books');
                return updateUser;
            };

            throw new AuthenticationError('Login to save books !');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updateUser = await User
                    .findOneAndUpdate(
                        { _id: context.user._id },
                        { $pull: { savedBooks: bookId } },
                        { new: true },
                    )
                    .populate('books');
                return updateUser;
            };

            throw new AuthenticationError('Login to remove books !');
        }
    },
};

module.exports = resolvers;