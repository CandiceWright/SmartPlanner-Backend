Drop database PlannerAppDb;
Create database PlannerAppDb;
Use PlannerAppDb;

create table Users (
    userId int primary key auto_increment,
    #firstName varchar(300) not null,
    #lastName varchar(300) not null,
    planitName varchar(600) not null unique,
    #nickname varchar(300),
    password varchar(400) not null,
    email varchar(300) not null unique,
	#username varchar(300),
    #phoneNumber varchar(30) not null,
    theme int, #this will likely change to an enum with all of the color theme options,
    #assistantCharacter varchar(300) not null #this will also likely be an enum
    didStartPlanningTomorrow Bool not null,
    profileImage varchar(600)
); 

create table LifeCategories (
    categoryId int primary key auto_increment,
     userId int(11) not null,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    #firstName varchar(300) not null,
    #lastName varchar(300) not null,
    name varchar(600) not null,
    color varchar(300) not null
);

create table Backlog (
    taskId int primary key auto_increment,
    userId int(11) not null,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    #firstName varchar(300) not null,
    #lastName varchar(300) not null,
    description varchar(600) not null,
    completeBy varchar(300) not null,
    scheduledDate varchar(300),
    calendarItem int(11) ,
     #FOREIGN KEY (calendarItem) REFERENCES ScheduledEvents(eventId),
    notes varchar(600) not null,
    #category varchar(300) not null, #should be an int foreign key
    category int(11) not null,
    FOREIGN KEY (category) REFERENCES LifeCategories(categoryId),
    isComplete Bool not null,
	location varchar(600)

);

create table ScheduledEvents (
    eventId int primary key auto_increment,
    userId int(11) not null,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    #firstName varchar(300) not null,
    #lastName varchar(300) not null,
    description varchar(600) not null,
    type varchar(300),
    start varchar(300) not null,
    end varchar(300) not null,
    notes varchar(600) not null,
    #category varchar(300) not null, #should be an int foreign key
     category int(11) not null,
    FOREIGN KEY (category) REFERENCES LifeCategories(categoryId),
	allDay Bool not null,
    location varchar(600),
    backlogItemRef int(11),
     FOREIGN KEY (backlogItemRef) REFERENCES Backlog(taskId)
);

create table Goals (
    goalId int primary key auto_increment,
    userId int(11) not null,
    FOREIGN KEY (userId) REFERENCES Users(userId),
    #firstName varchar(300) not null,
    #lastName varchar(300) not null,
    description varchar(600) not null,
    type varchar(300),
    start varchar(300) not null,
    end varchar(300) not null,
    notes varchar(600) not null,
    #category varchar(300) not null, #should be an int foreign key
    category int(11) not null,
    FOREIGN KEY (category) REFERENCES LifeCategories(categoryId),
	allDay Bool not null,
    isAccomplished Bool not null
);