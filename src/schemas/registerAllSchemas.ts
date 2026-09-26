import { FastifyInstance } from 'fastify';
import { swaggerConfig } from '../config/swagger.js';
import { authSwaggerSchemas } from './auth.schemas.js';
import { leadSchemas, leadSwaggerSchemas } from './lead.schemas.js';
import { productSwaggerSchemas } from './product.schemas.js';
import { agentstockSchemas, agentstockSwaggerSchemas } from './agentstock.schemas.js';
import { userSchemas } from './user.schemas.js';
import { inventoryLogSchemas, inventoryLogSwaggerSchemas } from './inventorylog.schemas.js';
import { orderEntitlementSchemas, orderEntitlementSwaggerSchemas } from './orderentitlement.schemas.js';
import { taskSchemas, taskSwaggerSchemas } from './task.schemas.js';
import { dashboardSchemas, dashboardSwaggerSchemas } from './dashboard.schemas.js';
// Order, delivery assignment, and order entitlement schemas removed for Phase 1.2

/**
 * Registers every schema found in swaggerConfig.openapi.components.schemas
 * and every schema referenced inside swaggerConfig.openapi.components.responses
 * with Fastify so that $ref references like `#/components/schemas/MySchema` work
 * at runtime.
 */
export async function registerAllSchemas(app: FastifyInstance): Promise<void> {
  const openapi = (swaggerConfig as any).openapi ?? {};
  const components = openapi.components ?? {};
  const schemas: Record<string, any> = components.schemas ?? {};
  const responses: Record<string, any> = components.responses ?? {};

  // Register direct schemas
  for (const [name, schema] of Object.entries(schemas)) {
    // Copy so we don't mutate the original object
    const sch = { ...schema, $id: name };
    // Skip if already registered
    if (!app.getSchema(name)) app.addSchema(sch);
  }

  // Register authentication schemas
  for (const [name, schema] of Object.entries(authSwaggerSchemas)) {
    const sch = { ...schema, $id: name };
    if (!app.getSchema(name)) app.addSchema(sch);
  }

  // Register lead schemas
  for (const [name, schema] of Object.entries(leadSwaggerSchemas)) {
    const sch = { ...schema, $id: name };
    if (!app.getSchema(name)) app.addSchema(sch);
  }

  // Register product schemas
  for (const [name, schema] of Object.entries(productSwaggerSchemas)) {
    const sch = { ...schema, $id: name };
    if (!app.getSchema(name)) app.addSchema(sch);
  }

  // Register agentstock schemas
  if (agentstockSwaggerSchemas && typeof agentstockSwaggerSchemas === 'object') {
    for (const [name, schema] of Object.entries(agentstockSwaggerSchemas)) {
      if (schema && typeof schema === 'object') {
        const sch = { ...schema, $id: name };
        if (!app.getSchema(name)) app.addSchema(sch);
      }
    }
  }

  // Register user schemas
  for (const [name, schema] of Object.entries(userSchemas)) {
    const sch = { ...schema, $id: name };
    if (!app.getSchema(name)) app.addSchema(sch);
  }

  // Register inventory log schemas
  if (inventoryLogSwaggerSchemas && typeof inventoryLogSwaggerSchemas === 'object') {
    for (const [name, schema] of Object.entries(inventoryLogSwaggerSchemas)) {
      if (schema && typeof schema === 'object') {
        const sch = { ...schema, $id: name };
        if (!app.getSchema(name)) app.addSchema(sch);
      }
    }
  }

  // Register order entitlement schemas
  if (orderEntitlementSwaggerSchemas && typeof orderEntitlementSwaggerSchemas === 'object') {
    for (const [name, schema] of Object.entries(orderEntitlementSwaggerSchemas)) {
      if (schema && typeof schema === 'object') {
        const sch = { ...schema, $id: name };
        if (!app.getSchema(name)) app.addSchema(sch);
      }
    }
  }

  // Register task schemas
  if (taskSwaggerSchemas && typeof taskSwaggerSchemas === 'object') {
    for (const [name, schema] of Object.entries(taskSwaggerSchemas)) {
      if (schema && typeof schema === 'object') {
        const sch = { ...schema, $id: name };
        if (!app.getSchema(name)) app.addSchema(sch);
      }
    }
  }

  // Register dashboard schemas
  if (dashboardSwaggerSchemas && typeof dashboardSwaggerSchemas === 'object') {
    for (const [name, schema] of Object.entries(dashboardSwaggerSchemas)) {
      if (schema && typeof schema === 'object') {
        const sch = { ...schema, $id: name };
        if (!app.getSchema(name)) app.addSchema(sch);
      }
    }
  }

  // Order, delivery assignment, and order entitlement schemas removed for Phase 1.2

  // Extract and register schemas referenced inside responses
  for (const resp of Object.values(responses)) {
    if (!resp || typeof resp !== 'object') continue;
    const content = resp.content ?? {};
    const jsonContent = content['application/json'];
    if (jsonContent && jsonContent.schema) {
      const schemaObj = jsonContent.schema;
      if (schemaObj.$ref) continue; // will be resolved separately
      // We need an $id for Ajv. Use a generated one based on hash of object.
      const id = schemaObj.$id ?? `resp_${Math.random().toString(36).substring(2)}`;
      const sch = { ...schemaObj, $id: id };
      if (!app.getSchema(id)) app.addSchema(sch);
    }
  }
}