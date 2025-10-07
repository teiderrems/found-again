import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiServiceService } from '../api-service.service';
import { AutoCompleteItem } from '../interfaces/dtos/api';
import { catchError, EMPTY } from 'rxjs';
import { parseDate } from '@/config/util.date';
import dayjs from '@/config/dayjs';

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrl: './reservation.component.css'
})
export class ReservationComponent implements OnInit{
  ngOnInit(): void {
    this.apiService.getCoordonnee('paris').subscribe(value=>{
      this.options_departure=value.pt_objects;
    });
    this.apiService.getCoordonnee('calais').subscribe(value=>{
          this.options_destination=value.pt_objects;
        });
  }

  getIcon():string{
    const icons=["home","home_pin","synagogue","move","explore_nearby"];
    const index=Math.floor(Math.random()*(icons.length-1));
    return icons[index];
  }

  private fb = inject(NonNullableFormBuilder);
  private apiService=inject(ApiServiceService);
  validateForm = this.fb.group({
    departure: this.fb.control('Paris', [Validators.required]),
    destination: this.fb.control('Calais', [Validators.required]),
    startDate:this.fb.control(dayjs().toDate()),
  });

  alternatives=[];
  @Output() trajets:EventEmitter<any[]>=new EventEmitter();

  @Output() infos:EventEmitter<{departure:string;destination:string;startDate:string}>=new EventEmitter();

  loading=false;
  options_departure: AutoCompleteItem[] = [];
  options_destination: AutoCompleteItem[] = [];

  getString(coord:any){
    return `${coord?.lon};${coord?.lat}`;
  }
toggleInput(){
  //this.validateForm.set
  const departure =this.validateForm.get<string>('departure')?.value??"";
  this.validateForm.get<string>('departure')?.setValue(this.validateForm.get<string>('destination')?.value);
  this.validateForm.get<string>('destination')?.setValue(departure);
  this.validateForm.get<string>('destination')?.setValue(departure);
  const options_departure = this.options_departure;
  this.options_departure=this.options_destination;
  this.options_destination=options_departure;

}
  onInputDeparture(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.apiService.getCoordonnee(value).subscribe(value=>{
        this.options_departure=value.pt_objects;
      });
    }
    this.options_departure = value ? this.options_departure.filter(v=>v.name?.includes(value)) : [];
  }

  onInputDestination(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) {
      this.apiService.getCoordonnee(value).subscribe(value=>{
        this.options_destination=value.pt_objects;
      });
    }
    this.options_destination = value ? this.options_destination.filter(v=>v.name?.includes(value)) : [];
  }




  submitForm() : void{
    if (this.validateForm.valid) {
      this.loading=true;
      const tmp_date= parseDate(this.validateForm.get<string>('startDate')?.value);
      const datetime=tmp_date.format('YYYYMMDDTHHMM');
      const departure=this.getString(this.options_departure.find(v=>v.name?.includes(this.validateForm.get<string>('departure')?.value as string))?.stop_area?.coord);
      const destination=this.getString(this.options_destination.find(v=>v.name?.includes(this.validateForm.get<string>('destination')?.value as string))?.stop_area?.coord);
      if (departure && destination) {
        this.apiService.getTrajets({from:departure,
          to:destination,
          datetime:datetime})
          .pipe(
            catchError(error=>{
            this.loading=false;
              return EMPTY;
            })
          )
          .subscribe(value=>{
            this.trajets.emit(value.journeys??[]);
            this.infos.emit({departure:this.validateForm.get('departure')?.value as string,
              destination:this.validateForm.get('destination')?.value as string,
              startDate:tmp_date.toString()
            });
            this.loading=false;
          })
      }
    }
  }
}
