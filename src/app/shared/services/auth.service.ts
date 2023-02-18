import { Injectable, NgZone } from '@angular/core';
import { User } from '../services/user';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

export class AuthService {

  userData: any; // Save logged in user data
  registerUserData: any;
  isGoogle = false;

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when 
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe((user: any) => {
      console.log("New userdata received: ", user)
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user')!);
      } else {
        localStorage.setItem('user', 'null');
        JSON.parse(localStorage.getItem('user')!);
      }
    });
  }

  // Sign in with email/password
  SignIn(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then(async (result) => {
        console.log("SIGN IN THEN RUNNING")
        console.log(result.user!.uid);
        this.afAuth.authState.subscribe((user: any) => {
          this.afs.collection(
            'Users'
          ).doc(result.user!.uid).get().toPromise().then(async (x: any) => {
            let userDocument = x.data();
            console.log("User document", userDocument);
            await this.SetUserData(userDocument);
            this.ngZone.run(() => {
              console.log("Navigating to dashboard")
              this.router.navigate(['dashboard']);
            });
          });
        });
      })
      .catch((error) => {
        console.log("SIGN IN CATCH RUNNING");
        throw new Error(error);
      });
  }

  // Sign up with email/password
  SignUpOne(email: string, password: string, displayName: string) {
    this.registerUserData = {
      email: email,
      password: password,
      displayName: displayName
    }
    this.router.navigate(['register-income']);
  }

  SignUpTwo(income: string) {
    this.registerUserData.income = income;
    if (!this.isGoogle) {
      // regular sign up
      return this.afAuth
      .createUserWithEmailAndPassword(this.registerUserData.email, this.registerUserData.password)
      .then((result) => {
        this.SetUserData(result.user);
        this.router.navigate(['dashboard']);
      })
      .catch((error) => {
        window.alert(error.message);
        this.router.navigate(['register-user']);
      });
    } else {
      // Google sign up
      return this.SetUserData(this.registerUserData).then(() => {
        this.router.navigate(['dashboard']);
      });
    }
  }

  // edit profile
  EditProfile(displayName: string, income: string) {
    return this.EditUserData(this.userData, displayName, income).then(() => {
      this.router.navigate(['profile']);
    });
  }

  // change password
  ChangePassword() {
    return this.afAuth.sendPasswordResetEmail(this.userData.email).then(() => {
      this.router.navigate(['profile']);
    });
  }

  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    console.log("Is user null? ", user)
    return user !== null;
    // return user !== null && user.emailVerified !== false ? true : false;
  }

  get hasIncome(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    console.log("User income: ", user.income)
    return this.registerUserData.income !== null;   
  }

  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider()).then((res: any) => {
      if (res) {
        console.log("Navigating to dashboard")
        this.router.navigate(['dashboard']);
      }
    });
  }

  AuthLogin(provider: any) {
    this.isGoogle = true;
    return this.afAuth
      .signInWithPopup(provider)
      .then(async (result) => {
        this.registerUserData = result.user;
        this.afAuth.authState.subscribe((user: any) => {
          this.afs.collection(
            'Users'
          ).doc(this.userData.uid).get().toPromise().then((x: any) => {
            let userDocument = x.data();
            console.log("User document", userDocument);
            if (userDocument !== undefined) {
              if (userDocument.income !== null) {
                console.log('has income')
                this.router.navigate(['dashboard']);
              } else {
                console.log('no income')
                this.router.navigate(['register-income']);
              }
            } else {
              // user does not exist in firestore
              this.router.navigate(['register-income']);
            }
          });
        });
      })
      .catch((error) => {
        window.alert(error);
      });
  }

  // Auth logic to run auth providers
  // AuthLogin(provider: any) {
  //   return this.afAuth
  //     .signInWithPopup(provider)
  //     .then(async (result) => {
  //       await this.SetUserData(result.user);

  //       this.ngZone.run(() => {
  //         console.log("Navigating to dashboard")
  //         this.router.navigate(['dashboard']);
  //       });
  //     })
  //     .catch((error) => {
  //       window.alert(error);
  //     });
  // }

  /* Setting up user data when sign in with email/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `Users/${user.uid}`
    );
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName !== null ? user.displayName : this.registerUserData.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      income: (user.income !== null && user.income !== undefined) ? user.income : this.registerUserData.income
    };
    return userRef.set(userData, {
      merge: true,
    });
  }

  EditUserData(user: any, displayName: string, income: string) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `Users/${user.uid}`
    );
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: displayName !== null ? displayName : user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      income: (income !== null && income !== undefined) ? income : user.income
    };
    return userRef.set(userData, {
      merge: true,
    });
  }

  // Sign out
  SignOut() {
    console.log("SIGN OUT FUNCTION RUNNING")
    return this.afAuth.signOut().then(() => {
      console.log("SIGN OUT THEN BLOCK RUNNING")
      localStorage.removeItem('user');
      console.log("Navigating to sign in")
      this.router.navigate(['sign-in']);
    });
  }

}