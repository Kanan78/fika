import { expect, test } from 'bun:test'

import { navigateHomeScreen } from '../src/features/home/navigation'

test('profile and home tabs switch between the two available demo screens', () => {
  expect(navigateHomeScreen('home', 'profile')).toBe('profile')
  expect(navigateHomeScreen('profile', 'home')).toBe('home')
})

test('catalog and orange tabs open their own screens', () => {
  expect(navigateHomeScreen('home', 'catalog')).toBe('catalog')
  expect(navigateHomeScreen('profile', 'orange')).toBe('orange')
})
