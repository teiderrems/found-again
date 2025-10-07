import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { collection, Firestore,addDoc, deleteDoc, query, where, getDocs, doc } from '@angular/fire/firestore';
import { Historic } from '../interfaces/dtos/api';

@Injectable({
  providedIn: 'root'
})
export class HistoricService {

  $user:any=null;

  constructor(private readonly firestore:Firestore,private readonly auth:Auth) {
    user(auth).subscribe(value=>{
      if (value && value.email) {
        this.$user=value.email;
      }
    });
  }

  addStat(stat:Historic){
    let $stat=collection(this.firestore,'historique');
    return addDoc($stat,{depart:stat.depart,destination:stat.destination,startDate:stat.startDate,owner:this.$user});
  }

  getAllHistoric(user:string){
    const q = query(collection(this.firestore, "historique"),where("owner","==",user));
    return getDocs(q);
  }

  async deleteHistoric(hist:Historic){
    const historique = doc(this.firestore,'historique',hist.id!);
    return deleteDoc(historique);
  }
}
