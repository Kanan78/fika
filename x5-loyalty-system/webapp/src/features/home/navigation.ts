export type HomeScreen = 'home' | 'profile' | 'catalog' | 'orange'
export type HomeNavigationTarget = HomeScreen

export function navigateHomeScreen(
  _currentScreen: HomeScreen,
  target: HomeNavigationTarget,
): HomeScreen {
  return target
}
