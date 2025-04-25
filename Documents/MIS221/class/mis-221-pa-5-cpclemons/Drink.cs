using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace mis_221_pa_5_cpclemons
{
    public class Drink
    {

        //Fields
        private int drinkID;
        private string drinkName;
        private double price;
        private bool isSoldOut;
        private bool softDelete;
        private static int count;
        
        //Default Constructor
        public Drink(){

        }
        //Constructor
        public Drink(int drinkID, string drinkName, double price, bool isSoldOut, bool softDelete){
            this.drinkID = drinkID;
            this.drinkName = drinkName;
            this.price = price;
            this.isSoldOut = isSoldOut;
            this.softDelete = softDelete;
        }

        //Getters
        public int GetDrinkID(){
            return drinkID;
        }
        public string GetDrinkName(){
            return drinkName;
        }
        public double GetPrice(){
            return price;
        }
        public bool GetIsSoldOut(){
            return isSoldOut;
        }
        public bool GetSoftDelete(){
            return softDelete;
        }

        //Setters
        public void SetDrinkID(int drinkID){
            this.drinkID = drinkID;
        }
        public void SetDrinkName(string drinkName){
            this.drinkName = drinkName;
        }
        public void SetPrice(double price){
            this.price = price;
        }
        public void SetIsSoldOut(bool isSoldOut){
            this.isSoldOut = isSoldOut;
        }
        public void SetSoftDelete(bool softDelete){
            this.softDelete = softDelete;
        }

        //Other methods
        public static int GetCount(){
            return count;
        }
        public static void SetCount(int count){
            Drink.count = count;
        }
        public static void IncCount(){
            count++;
        }
        public override string ToString(){
            return $"Drink ID: {drinkID}\tDrink Name: {drinkName}\tPrice: {price}"; //doesn't include isSoldOut and softDelete because customers don't need to view that
        }
        public string ToFile(){
            return $"{drinkID}#{drinkName}#{price}#{isSoldOut}#{softDelete}";
        }   

    }
}
  