import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userData: any;
  loaded = false;
  totalHours = 0;
  totalAmount = 0;
  emailVerified: boolean = false;
  emailSent: boolean = false;
  constructor(public authService: AuthService,  public afs: AngularFirestore, public afAuth: AngularFireAuth,
    public router: Router) { }

  ngOnInit(): void {
    this.afAuth.authState.subscribe((user: any) => {
      if (!user) {
        this.router.navigate(['sign-in']);
      }
      this.afs.collection(
        'Users'
      ).doc(user.uid).get().toPromise().then((x: any) => {
        this.userData = x.data();
        this.emailVerified = this.userData.emailVerified;
        console.log('userdata:', this.userData);
        if (this.userData.donations === null || this.userData.donations === undefined) {
          this.userData.donations = [];
        }
        for (var donation of this.userData.donations) {
          this.totalAmount += donation.donatedAmount;
          this.totalHours += donation.duration;
        }
        this.totalHours /= 60;
        this.totalHours = parseFloat(this.totalHours.toFixed(2));
        this.loaded = true;
        console.log("User document", this.userData);
      });
    });
  }

  changePassword() {
    this.authService.ChangePassword().then(() => {
      console.log("then block in change password component running")
      this.emailSent = true;
    }).catch((error) => {
      console.log("catch block in change password component running");
      console.log("Error:" , error);
    });
  }
}
