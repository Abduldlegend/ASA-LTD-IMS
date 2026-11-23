import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { authRoutes } from './authServer'
import { fail, matchRoute, network, type Route } from './http'
import { usersRoutes } from './users'
import { catalogRoutes } from './catalog'
import { procurementRoutes } from './procurement'
import { inventoryRoutes } from './inventory'
import { productionRoutes } from './production'

// Add each new module's routes here as it is built.
const routes: Route[] = [...authRoutes, ...usersRoutes, ...catalogRoutes, ...procurementRoutes, ...inventoryRoutes, ...productionRoutes]

/** Plugs into Axios as its adapter, so interceptors, headers and errors behave as they will for real. */
export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    if (network.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, network.delayMs))

    const method = (config.method ?? 'get').toUpperCase()
    const url = config.url ?? ''
    const found = matchRoute(routes, method, url)
    if (!found) fail(config, 404, { message: `The mock API has no endpoint for ${method} ${url}.`, code: 'NOT_FOUND' })
    return found!.handler(config, found!.params)
}