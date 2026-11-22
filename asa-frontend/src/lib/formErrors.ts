import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toApiError } from './apiError'

/**
 * Puts what the server said back on the form. Problems that belong to a field appear under that
 * field; anything else is returned as one message for the top of the form.
 *
 *   catch (e) { setFormError(applyApiError(e, FIELDS, setError)) }
 */
export function applyApiError<T extends FieldValues>(error: unknown, fields: readonly Path<T>[], setError: UseFormSetError<T>): string | null {
    const apiError = toApiError(error)
    const matched = Object.entries(apiError.fieldErrors ?? {}).filter(([field]) => (fields as readonly string[]).includes(field))
    if (matched.length === 0) return apiError.message
    for (const [field, message] of matched) setError(field as Path<T>, { message })
    return null
}