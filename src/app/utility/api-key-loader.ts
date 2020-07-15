import { HttpClient } from '@angular/common/http';
import { of, Observable, ObservableInput } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';

export function loadAPIKey(http: HttpClient, config: ConfigService): (() => Promise<boolean>) {
    return (): Promise<boolean> => {
        return new Promise<boolean>((resolve: (a: boolean) => void): void => {
        http.get('./assets/rapidapikey.json')
            .pipe(
            map((x: ConfigService) => {
                config.rapidApiKey = x.rapidApiKey;
                resolve(true);
            }),
            catchError((x: {status: number}, caught: Observable<void>): ObservableInput<{}> => {
                if (x.status !== 404) {
                resolve(false);
                }
                config.rapidApiKey = "unknown";
                resolve(true);
                return of({});
            })
            ).subscribe();
        });
    };
    }
