import { daysInRange, describeRange, isValidRange, rangeError, rangeForPreset } from './dateRange'

// Friday 20 November 2026
const now = new Date(2026, 10, 20, 15, 30)

describe('rangeForPreset', () => {
    it('today is a single day', () => {
        expect(rangeForPreset('today', now)).toEqual({ from: '2026-11-20', to: '2026-11-20' })
    })
    it('this week starts on Monday', () => {
        expect(rangeForPreset('week', now)).toEqual({ from: '2026-11-16', to: '2026-11-20' })
    })
    it('this month starts on the 1st', () => {
        expect(rangeForPreset('month', now)).toEqual({ from: '2026-11-01', to: '2026-11-20' })
    })
})

describe('custom ranges', () => {
    it('counts both end days', () => {
        expect(daysInRange({ from: '2026-11-01', to: '2026-11-07' })).toBe(7)
    })
    it('accepts a normal range', () => {
        expect(isValidRange({ from: '2026-11-01', to: '2026-11-07' })).toBe(true)
    })
    it('rejects a start after the end', () => {
        expect(rangeError({ from: '2026-11-10', to: '2026-11-01' })).toMatch(/start date/)
    })
    it('rejects missing dates', () => {
        expect(rangeError({ from: '', to: '2026-11-01' })).toMatch(/both/)
    })
    it('rejects ranges longer than a year', () => {
        expect(isValidRange({ from: '2025-01-01', to: '2026-11-01' })).toBe(false)
    })
})

describe('describeRange', () => {
    it('uses the preset name', () => {
        expect(describeRange('week', rangeForPreset('week', now))).toBe('This week')
    })
    it('spells out custom ranges', () => {
        expect(describeRange('custom', { from: '2026-11-01', to: '2026-11-14' })).toBe('1 Nov to 14 Nov 2026')
    })
})