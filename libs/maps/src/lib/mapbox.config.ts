import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export const MAPBOX_ACCESS_TOKEN = new InjectionToken<string>('MAPBOX_ACCESS_TOKEN');

export function provideMapbox(accessToken: string): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: MAPBOX_ACCESS_TOKEN, useValue: accessToken }]);
}
