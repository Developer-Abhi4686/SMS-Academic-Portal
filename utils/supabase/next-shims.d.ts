declare module "next/headers" {
  export function cookies(): any;
}
declare module "next/server" {
  export class NextResponse {
    static next(init?: any): any;
  }
  export type NextRequest = any;
}
