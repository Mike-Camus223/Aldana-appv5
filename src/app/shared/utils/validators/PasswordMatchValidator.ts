import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const PasswordMatch = (firstControl: string, secondControl: string): ValidatorFn => {
    return (formGroup: AbstractControl): ValidationErrors | null => {
        const passwordControl = formGroup.get(firstControl);
        const repeatPasswordControl = formGroup.get(secondControl);

        return passwordControl?.value === repeatPasswordControl?.value ? null : { passwordNotMatch: true};
    }
}