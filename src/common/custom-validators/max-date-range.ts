// src/common/custom-validators/max-date-range.ts

import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraintInterface, ValidatorConstraint } from 'class-validator';

@ValidatorConstraint({ name: 'maxDateRange', async: false })
class MaxDateRangeConstraint implements ValidatorConstraintInterface {
    private message = '';

    validate(value: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const startDate = new Date((args.object as any)[relatedPropertyName]);
        const endDate = new Date(value);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            this.message = '유효하지 않은 날짜 형식입니다';
            return false;
        }
        
        if(startDate.getTime() > endDate.getTime()) {
            this.message = '시작일은 종료일보다 늦을 수 없습니다';
            return false;
        }
        
        const maxDate = new Date(startDate);
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        
        if(endDate > maxDate) {
            this.message = '검색 기간은 1년을 초과할 수 없습니다';
            return false;
        }
        
        return true;
    }

    defaultMessage() {
        return this.message || '날짜 범위가 유효하지 않습니다';
    }
}

export function MaxDateRange(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'maxDateRange',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [property],
            options: validationOptions,
            validator: MaxDateRangeConstraint
        });
    };
}