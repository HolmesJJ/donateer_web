import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import * as FileSaver from 'file-saver'
import { render } from 'creditcardpayments/creditCardPayments';
import { GoogleCalendar, ICalendar, CalendarOptions } from 'datebook';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  donationDetails: any;
  userData: any;
  userDocument: any;
  existingDonations: any;
  paypal: any;

  constructor(public authService: AuthService, public afs: AngularFirestore, public afAuth: AngularFireAuth,
    public router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.donationDetails = navigation!.extras.state;
    if (!this.donationDetails) {
      this.router.navigate(['donate']);
    }
    console.log("Donation details: ", this.donationDetails);
  }

  async ngOnInit() {
    this.afAuth.authState.subscribe((user: any) => {
      if (!user) {
        this.router.navigate(['sign-in']);
      }
      this.userData = user;
      this.existingDonations = this.afs.collection(
        'Users'
      ).doc(this.userData.uid).get().toPromise().then((x: any) => {
        this.userDocument = x.data();
        this.existingDonations = this.userDocument['donations'];
        if (this.existingDonations === null || this.existingDonations === undefined) {
          this.existingDonations = [];
        }
      });
    });
    render({
      id: "#paypalButton",
      currency: "SGD",
      value: this.donationDetails.donatedAmount,
      onApprove: (details) => {
        alert("success");
        this.onSubmit();
      }});
  }

  addToCalendar() {
    const start = this.donationDetails.date.toString().substring(0, 15) + this.donationDetails.start.toString().substring(15, 21);
    const end = this.donationDetails.date.toString().substring(0, 15) + this.donationDetails.end.toString().substring(15, 21);
    const config : CalendarOptions = {
      title: "Donateer for: " + this.donationDetails.name,
      description: this.donationDetails.description,
      start: new Date(start),
      end: new Date(end)
    };
    const googleCalendar = new GoogleCalendar(config);
    window.open(googleCalendar.render(), '_blank');
  }

  downloadCalendar() {
    const start = this.donationDetails.date.toString().substring(0, 15) + this.donationDetails.start.toString().substring(15, 21);
    const end = this.donationDetails.date.toString().substring(0, 15) + this.donationDetails.end.toString().substring(15, 21);
    const config : CalendarOptions = {
      title: "Donateer for: " + this.donationDetails.name,
      description: this.donationDetails.description,
      start: new Date(start),
      end: new Date(end)
    };
    const iCalendar = new ICalendar(config);
    const ics = iCalendar.render()
    const blob = new Blob([ics], {
      type: 'text/calendar'
    });
    FileSaver.saveAs(blob, 'donateer.ics');
  }

  async onSubmit() {
    this.existingDonations.push(this.donationDetails);
    console.log("Existing donations:", this.existingDonations);
    await this.afs.collection(
      'Users'
    ).doc(this.authService.userData.uid).update({
      'donations': this.existingDonations,
    });
    this.router.navigate(['profile']);
  }

}
