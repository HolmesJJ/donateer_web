import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-donate',
  templateUrl: './donate.component.html',
  styleUrls: ['./donate.component.scss']
})
export class DonateComponent implements OnInit {
  name = "Society for the Prevention of Cruelty to Animals (SPCA)";
  description = "The SPCA is not funded by the government. Relying mainly on kind donations from the public and fundraising to support the shelter and clinic, inspectorate work and animal rescue services, as well as other initiatives such as our foster care programme, sterilisation programme for community animals, and education and outreach efforts."
  today = new Date();
  date = new Date();
  startDate = new Date(); // start time
  endDate = new Date(); // end time
  // duration?: Date;
  form!: FormGroup;
  donatedAmount: number = 0;
  donatedTime: number = 0;
  userData: any;
  userDocument: any;
  existingDonations: any;


  constructor(public authService: AuthService, private formBuilder: FormBuilder, public afs: AngularFirestore, public afAuth: AngularFireAuth,
    public router: Router) {

  }

  async ngOnInit() {
    this.createForm();
    // await this.afs.collection(
    //   `Organisations`
    // ).get().toPromise().then((organisations: any) => {
    //   organisations?.forEach((organisation: any) => {
    //     console.log("Organisation data: ",organisation.data());
    //   });
    // });
    this.afAuth.authState.subscribe((user: any) => {
      if (!user) {
        this.router.navigate(['sign-in']);
      }
      this.userData = user;
      console.log("USER DATA:", this.userData);
      this.existingDonations = this.afs.collection(
        'Users'
      ).doc(this.userData.uid).get().toPromise().then((x: any) => {
        this.userDocument = x.data();
        console.log("User document", this.userDocument);
      });
    });

  }

  createForm() {
    this.form = this.formBuilder.group({
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: [{ value: '', disabled: true }, Validators.required],
    });
  }

  async onSubmit(form: FormGroup) {
    let donation: NavigationExtras = {
      state: {
        name: this.name,
        description: this.description,
        date: this.date,
        start: this.startDate,
        donatedAmount: this.donatedAmount,
        duration: this.donatedTime,
        end: this.endDate
      }
    };
    this.router.navigate(['/payment'], donation);
  }

  onChangeStartTime(time: Date) {
    console.log("TIme:", time)
    this.startDate = time;
    this.form.get("endTime")!.enable();
  }

  onChangeEndTime(time: Date) {
    this.endDate = time;
    this.donatedTime = Math.floor((time.getTime() - this.startDate.getTime()) / 1000 / 60);
    this.donatedAmount = parseFloat((this.donatedTime / 60 * this.userDocument['income'] / (44 * 4)).toFixed(2)); // average working hours of 44 per week in Singapore
    console.log("DIFFERENCE: ", this.donatedTime);
    console.log("Donated amount:", this.donatedAmount);
  }

  onChangeDate(time: Date) {
    this.date = time;
  }
}