import type { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export function setupSwagger(app: Express) {
    const options = {
        definition: {
            openapi: "3.0.0",
            info: {
                title: "Kudamine API",
                version: "1.0.0",
                description: "API docs with Swagger UI",
            },
        },
        apis: ["src/routes/*.ts"],
    };

    const swaggerSpec = swaggerJSDoc(options);
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
