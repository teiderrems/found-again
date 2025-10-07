import { HttpInterceptorFn } from '@angular/common/http';

export const requestInterceptor: HttpInterceptorFn = (req, next) => {

  if (req.url.includes('sncf')) {
    const clonedRequest = req.clone({
      setHeaders: {
        'Authorization': '55e88c66-cf4c-49cc-a79c-566a72cbc539',
      },
    });
    return next(clonedRequest);
  }
  return next(req);
};
