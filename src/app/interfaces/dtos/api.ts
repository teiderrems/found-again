
export interface commercial_modes{
    id:string,
    name:string
}

export interface ReservetionDto{
    from:string;
    to:string;
    datetime:string;
}

export interface User {
    uid: string;
    email: string;
    photoURL?: string;
    displayName?: string;
    myCustomData?: string;
}

export interface AutoCompleteItem{
    id?:string;
    name?:string;
    quality?:number;
    stop_area?:{
        id:string;
        name:string;
        label:string;
        administrative_regions:any[];
        codes:any[];
        coord:{
            lat?:string;
            lon?:string;
        };
        links:any[];
        timezone:string;
    }
    embedded_type?:string;
}

export interface JourneyItem{
    id?:string;
    sections?:SectionItem[];
    fare?:[];
    status?:string;
    type?: string;
    nb_transfers?: number;
    duration?: number;
    requested_date_time?:string;
    departure_date_time?: string;
    arrival_date_time?: string;
    calendars?: any[];
    co2_emission?: any;
    price?:number;
}

export interface CustomType{
    item:JourneyItem;
    visible:boolean;
}

export interface SectionItem{
    id:string;
    from: any;
    to: any;
    arrival_date_time: string;
    departure_date_time: string;
    duration: 930,
    display_informations?:any;
    type: string,
    mode: string;
    geojson: any;
    path: any[];
    links:any[];
}


export interface Historic{
    id?:string;
    depart:string | undefined;
    destination:string | undefined;
    startDate:string | undefined;
    owner?:string | undefined;
}
