using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace pa5Lasttimepls
{
    public class Pizza
    {
        //Fields
        private int pizzaID;
        private string pizzaName;
        private int toppingCount;
        private string crustType;
        private double price;
        private bool isSoldOut;
        private bool softDelete; 
        private static int count;
        
        //Default Constructor
        public Pizza()
        {

        }

        //Constructor
        public Pizza(int pizzaID, string pizzaName, int toppingCount, string crustType, double price, bool isSoldOut, bool softDelete){
            this.pizzaID = pizzaID;
            this.pizzaName = pizzaName;
            this.toppingCount = toppingCount;
            this.crustType = crustType;
            this.price = price;
            this.isSoldOut = isSoldOut;
            this.softDelete = softDelete;
        }

        //Getters
        public int GetPizzaID(){
            return pizzaID;
        }
        public string GetPizzaName(){
            return pizzaName;
        }
        public int GetToppingCount(){
            return toppingCount;
        }
        public string GetCrustType(){
            return crustType;
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
        public void SetPizzaID(int pizzaID){
            this.pizzaID = pizzaID;
        }
        public void SetPizzaName(string pizzaName){
            this.pizzaName = pizzaName;
        }
        public void SetToppingCount(int toppingCount){
            this.toppingCount = toppingCount;
        }
        public void SetCrustType(string crustType){
            this.crustType = crustType;
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

        //Other Methods
        public static int GetCount(){
            return count;
        }
        public static void SetCount(int count){
            Pizza.count = count;
        }
        public static void IncCount(){
            count++;
        }
        public override string ToString()
        {
            return $"Pizza ID: {pizzaID}\tPizza Name: {pizzaName}\tTopping Count: {toppingCount}\tCrust Type: {crustType}\tPrice: {price}"; //doesn't include isSoldOut and softDelete because customers don't need to view that
        }
        public string ToFile(){
            return $"{pizzaID}#{pizzaName}#{toppingCount}#{crustType}#{price}#{isSoldOut}#{softDelete}";
        }
    }
}