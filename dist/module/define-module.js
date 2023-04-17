"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineModule = void 0;
const lodash_1 = require("lodash");
function defineModule(inputs1) {
    return {
        with: ({ actions, ...inputs2 }) => ({
            ...inputs1,
            ...inputs2,
            actions: (0, lodash_1.fromPairs)((0, lodash_1.toPairs)(actions).map(([name, { parameters = {}, ...definition }]) => [
                name,
                {
                    name,
                    parameters: (0, lodash_1.mapValues)(parameters, (parameter) => ({
                        optional: false,
                        ...parameter,
                    })),
                    ...definition,
                },
            ])),
        }),
    };
}
exports.defineModule = defineModule;
