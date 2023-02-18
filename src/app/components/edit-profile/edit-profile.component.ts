import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  form!: FormGroup;
  submitted: boolean = false;
  errorLogin: boolean = false;
  userData: any;
  loaded = false;
  constructor(public authService: AuthService,  public afs: AngularFirestore, public afAuth: AngularFireAuth,
    public router: Router, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.formInit()
    this.afAuth.authState.subscribe((user: any) => {
      if (!user) {
        this.router.navigate(['sign-in']);
      }
      this.afs.collection(
        'Users'
      ).doc(user.uid).get().toPromise().then((x: any) => {
        this.userData = x.data();
        
        this.loaded = true;
        console.log("User document", this.userData);
      });
    });
  }

  formInit() {
    /* INITIALIZE INPUT FORM */
    this.form = this.formBuilder.group({
      username: ['', Validators.compose([Validators.required])],
      income: ['', Validators.compose([Validators.required])],
    });
  }

  onSubmit(form: FormGroup) {
    this.authService.EditProfile(form.value.username, form.value.income).then(() => {
      console.log("then block in edit profile component running")
    }).catch((error) => {
      this.errorLogin = true;
      console.log("catch block in edit profile component running");
      console.log("Error:" , error);
    });
    this.router.navigate(['profile']);
  }

}
